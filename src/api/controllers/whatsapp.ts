import { Client, LocalAuth } from "whatsapp-web.js";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { sendToUser } from "./websocket";
import { checkPlanLimits } from "@/utils/planLimits";
import { createAuditLog, AuditCategory } from "@/utils/audit-logger";

const prisma = new PrismaClient();
const clients: Record<string, Client> = {};

// Fungsi untuk memperbarui status dan waktu terakhir aktif
const updateLastActive = async (client: Client, whatsappId: string, userId: string) => {
  try {
    // Cek apakah klien memiliki state dan informasi yang valid
    const isSessionActive = client.info && client.info.wid ? true : false;
    
    // Coba cek status dengan command "ping"
    let pingResult = false;
    try {
      // Coba lakukan operasi sederhana untuk menguji koneksi
      await client.getState();
      pingResult = true;
    } catch (error) {
      pingResult = false;
    }
    
    // Akun dianggap terhubung jika session aktif dan ping berhasil
    const isConnected = isSessionActive && pingResult;
    
    await prisma.whatsAppAccount.update({
      where: { id: whatsappId },
      data: { 
        status: isConnected ? "CONNECTED" : "DISCONNECTED",
        lastActive: isConnected ? new Date() : undefined
      },
    });

    sendToUser(userId, {
      type: "STATUS_UPDATE",
      whatsappId,
      status: isConnected ? "CONNECTED" : "DISCONNECTED"
    });
  } catch (error) {
    console.error("Error updating last active status:", error);
    // Jika terjadi error, maka koneksi bermasalah
    await prisma.whatsAppAccount.update({
      where: { id: whatsappId },
      data: { 
        status: "DISCONNECTED",
        lastActive: undefined
      },
    });
    
    sendToUser(userId, {
      type: "STATUS_UPDATE",
      whatsappId,
      status: "DISCONNECTED"
    });
  }
};

// Fungsi untuk memulai interval pembaruan status
const startStatusUpdateInterval = (client: Client, whatsappId: string, userId: string) => {
  const intervalId = setInterval(() => {
    updateLastActive(client, whatsappId, userId);
  }, 60000); // Update setiap menit

  return intervalId;
};

export const connectWhatsApp = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  const { name } = await req.json();
  
  try {
    // Buat WhatsApp account baru
    const whatsappAccount = await prisma.whatsAppAccount.create({
      data: {
        name,
        status: "CONNECTING",
        userId: auth.userId,
      },
    });

    // Inisialisasi client WhatsApp
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: whatsappAccount.id,
      }),
      puppeteer: {
        headless: true,
        timeout: 60000, // Menambah timeout menjadi 60 detik
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      }
    });

    // Event handlers dengan error handling
    client.on("qr", async (qr) => {
      console.log("QR Code generated:", qr.slice(0, 20) + "...");
      try {
        await prisma.whatsAppAccount.update({
          where: { id: whatsappAccount.id },
          data: { qrCode: qr },
        });
        console.log("Sending QR code to user:", auth.userId);
        sendToUser(auth.userId, {
          type: "QR_CODE",
          whatsappId: whatsappAccount.id,
          qrCode: qr
        });
      } catch (error) {
        console.error("Error handling QR code:", error);
      }
    });

    let isReady = false;
    
    // Event handler untuk ready
    client.on("ready", async () => {
      console.log("Client ready event received");
      isReady = true;
      
      try {
        // Update status dan hapus QR code
        await prisma.whatsAppAccount.update({
          where: { id: whatsappAccount.id },
          data: { 
            status: "CONNECTED",
            qrCode: null,
            lastActive: new Date()
          },
        });

        // Kirim notifikasi ke user
        sendToUser(auth.userId, {
          type: "STATUS_UPDATE",
          whatsappId: whatsappAccount.id,
          status: "CONNECTED"
        });

        // Simpan client ke daftar clients
        clients[whatsappAccount.id] = client;

        // Mulai interval pembaruan status
        const intervalId = startStatusUpdateInterval(client, whatsappAccount.id, auth.userId);
        client.on("disconnected", () => {
          clearInterval(intervalId);
        });
      } catch (error) {
        console.error("Error handling ready state:", error);
      }
    });

    // Tambahkan error handler
    client.on("auth_failure", async () => {
      try {
        await prisma.whatsAppAccount.update({
          where: { id: whatsappAccount.id },
          data: { status: "AUTH_FAILED" },
        });
        sendToUser(auth.userId, {
          type: "STATUS_UPDATE",
          whatsappId: whatsappAccount.id,
          status: "AUTH_FAILED"
        });
      } catch (error) {
        console.error("Error handling auth failure:", error);
      }
    });

    // Event handler untuk pesan
    client.on("message", async (message) => {
      try {
        console.log("Message received:", {
          from: message.from,
          body: message.body,
          id: message.id._serialized
        });

        // Update lastActive
        await prisma.whatsAppAccount.update({
          where: { id: whatsappAccount.id },
          data: { lastActive: new Date() },
        });

        const account = await prisma.whatsAppAccount.findUnique({
          where: { id: whatsappAccount.id }
        });

        // Simpan pesan ke database
        const savedMessage = await prisma.whatsAppMessage.create({
          data: {
            id: message.id._serialized,
            message: message.body,
            sender: message.from,
            to: message.to || account?.phoneNumber || '',
            status: "RECEIVED",
            whatsAppAccount: {
              connect: { id: whatsappAccount.id }
            },
            user: {
              connect: { id: auth.userId }
            }
          }
        });

        console.log("Message saved to database:", savedMessage);

        // Kirim notifikasi ke user melalui WebSocket
        sendToUser(auth.userId, {
          type: "MESSAGE_RECEIVED",
          whatsappId: whatsappAccount.id,
          message: {
            id: message.id._serialized,
            from: message.from,
            to: message.to || account?.phoneNumber,
            body: message.body,
            timestamp: message.timestamp
          }
        });

        // Kirim webhook jika ada
        if (account?.webhookUrl) {
          try {
            await fetch(account.webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messageId: message.id._serialized,
                from: message.from,
                to: message.to || account.phoneNumber,
                body: message.body,
                timestamp: message.timestamp,
              })
            });
            console.log("Webhook delivered successfully");
          } catch (webhookError) {
            console.error('Webhook delivery failed:', webhookError);
          }
        }
      } catch (error) {
        console.error("Error handling incoming message:", error);
      }
    });

    // Simpan client instance
    clients[whatsappAccount.id] = client;
    
    // Initialize client
    console.log("Initializing WhatsApp client...");
    await client.initialize();
    console.log("WhatsApp client initialized");

    return new Response(
      JSON.stringify({ 
        message: "WhatsApp connection initiated",
        whatsappId: whatsappAccount.id 
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error connecting WhatsApp:", error);
    return new Response(
      JSON.stringify({ error: "Gagal menghubungkan WhatsApp" }), 
      { status: 500 }
    );
  }
};

export const getWhatsAppAccounts = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    const accounts = await prisma.whatsAppAccount.findMany({
      where: { userId: auth.userId },
    });

    return new Response(JSON.stringify(accounts), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Gagal mengambil data akun WhatsApp" }), 
      { status: 500 }
    );
  }
};

export const deleteWhatsAppAccount = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  const { id } = await req.json();

  try {
    // Periksa kepemilikan akun
    const account = await prisma.whatsAppAccount.findFirst({
      where: {
        id,
        userId: auth.userId
      }
    });

    if (!account) {
      return new Response(
        JSON.stringify({ error: "Akun WhatsApp tidak ditemukan" }), 
        { status: 404 }
      );
    }

    // Hapus client instance jika ada
    if (clients[id]) {
      await clients[id].destroy();
      delete clients[id];
    }

    // Hapus semua pesan terkait
    await prisma.whatsAppMessage.deleteMany({
      where: { whatsAppAccountId: id }
    });

    // Hapus semua API key terkait
    await prisma.aPIKey.deleteMany({
      where: { whatsappId: id }
    });

    // Hapus akun dari database
    await prisma.whatsAppAccount.delete({
      where: { id }
    });

    return new Response(
      JSON.stringify({ message: "Akun WhatsApp berhasil dihapus" }), 
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting WhatsApp account:", error);
    return new Response(
      JSON.stringify({ error: "Gagal menghapus akun WhatsApp" }), 
      { status: 500 }
    );
  }
};

export const getOrCreateAPIKey = async (req: Request, accountId: string) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    // Cek kepemilikan akun
    const account = await prisma.whatsAppAccount.findFirst({
      where: {
        id: accountId,
        userId: auth.userId
      },
      include: {
        apiKeys: true
      }
    });

    if (!account) {
      return new Response(
        JSON.stringify({ error: "Akun WhatsApp tidak ditemukan" }), 
        { status: 404 }
      );
    }

    // Gunakan API key yang ada atau buat baru
    let apiKey = account.apiKeys[0];
    if (!apiKey) {
      apiKey = await prisma.aPIKey.create({
        data: {
          key: crypto.randomUUID(),
          name: "Default API Key",
          userId: auth.userId,
          whatsappId: accountId
        }
      });
    }

    return new Response(
      JSON.stringify({ apiKey: apiKey.key }), 
      { status: 200 }
    );
  } catch (error) {
    console.error("Error managing API key:", error);
    return new Response(
      JSON.stringify({ error: "Gagal mengelola API key" }), 
      { status: 500 }
    );
  }
};

export const sendWhatsAppMessage = async (req: Request) => {
  const apiKey = req.headers.get("X-API-Key");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key diperlukan" }), 
      { status: 401 }
    );
  }

  try {
    const { to, message } = await req.json();
    
    // Validasi API key dan dapatkan client
    const key = await prisma.aPIKey.findUnique({
      where: { key: apiKey },
      include: { 
        whatsappAccount: {
          include: {
            user: {
              include: {
                plan: true,
                whatsAppAccounts: true
              }
            }
          }
        }
      }
    });

    if (!key) {
      return new Response(
        JSON.stringify({ error: "API key tidak valid" }), 
        { status: 401 }
      );
    }

    if (!key.whatsappAccount || !key.whatsappAccount.user) {
      return new Response(
        JSON.stringify({ error: "Data akun WhatsApp atau user tidak ditemukan" }), 
        { status: 404 }
      );
    }

    // Cek batasan paket
    const user = key.whatsappAccount.user;
    
    // Hitung jumlah pesan bulan ini
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const messageCount = await prisma.whatsAppMessage.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    const limits = checkPlanLimits({
      planId: user.planId,
      currentAccounts: user.whatsAppAccounts?.length || 0,
      currentMessages: messageCount
    });

    if (!limits.canSendMessage) {
      return new Response(
        JSON.stringify({ 
          error: "Batas pengiriman pesan bulanan telah tercapai. Silakan upgrade paket Anda." 
        }), 
        { status: 403 }
      );
    }

    // Tambah logging
    console.log("Sending message with API key:", apiKey);
    console.log("WhatsApp account ID:", key.whatsappAccount.id);
    console.log("Available clients:", Object.keys(clients));
    
    const client = clients[key.whatsappAccount.id];
    if (!client) {
      return new Response(
        JSON.stringify({ 
          error: "WhatsApp client tidak tersedia atau belum terhubung",
          debug: {
            accountId: key.whatsappAccount.id,
            availableClients: Object.keys(clients)
          }
        }), 
        { status: 400 }
      );
    }

    // Tambah logging
    console.log("Client found, attempting to send message");

    // Kirim pesan
    await client.sendMessage(`${to}@c.us`, message);

    // Simpan record pesan
    await prisma.whatsAppMessage.create({
      data: {
        to,
        message,
        status: 'SENT',
        sender: to,
        user: {
          connect: { id: user.id }
        },
        whatsAppAccount: {
          connect: { id: key.whatsappAccount.id }
        }
      }
    });

    return new Response(
      JSON.stringify({ message: "Pesan berhasil dikirim" }), 
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return new Response(
      JSON.stringify({ 
        error: "Gagal mengirim pesan",
        details: error instanceof Error ? error.message : String(error)
      }), 
      { status: 500 }
    );
  }
};

export const replyWhatsAppMessage = async (req: Request) => {
  const apiKey = req.headers.get("X-API-Key");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key diperlukan" }), 
      { status: 401 }
    );
  }

  try {
    const { messageId, message } = await req.json();
    
    // Tambah logging untuk debug
    console.log("Attempting to reply to message:", messageId);
    console.log("Using API key:", apiKey);
    
    const key = await prisma.aPIKey.findUnique({
      where: { key: apiKey },
      include: { 
        whatsappAccount: {
          include: {
            user: {
              include: {
                plan: true,
                whatsAppAccounts: true
              }
            }
          }
        } 
      }
    });

    if (!key || !key.isActive) {
      console.log("API key not found or inactive");
      return new Response(
        JSON.stringify({ error: "API key tidak valid" }), 
        { status: 401 }
      );
    }

    // Log WhatsApp account info
    console.log("WhatsApp account ID:", key.whatsappAccount?.id);
    console.log("Available clients:", Object.keys(clients));

    const client = clients[key.whatsappAccount.id];
    if (!client) {
      return new Response(
        JSON.stringify({ 
          error: "WhatsApp client tidak tersedia",
          details: "Silakan coba reconnect melalui dashboard"
        }), 
        { status: 400 }
      );
    }

    try {
      // Ekstrak chat ID dari message ID
      // Format messageId: false_CHATID_MESSAGEID
      const chatId = messageId.split('_')[1];
      if (!chatId) {
        throw new Error("Format message ID tidak valid");
      }

      console.log("Attempting to send message to chat:", chatId);
      
      // Kirim pesan langsung ke chat
      await client.sendMessage(chatId, message);

      // Simpan record pesan
      await prisma.whatsAppMessage.create({
        data: {
          message,
          status: 'SENT',
          sender: client.info.wid._serialized,
          to: chatId,
          user: {
            connect: { id: key.whatsappAccount.user.id }
          },
          whatsAppAccount: {
            connect: { id: key.whatsappAccount.id }
          }
        }
      });

      return new Response(
        JSON.stringify({ message: "Balasan berhasil dikirim" }), 
        { status: 200 }
      );
    } catch (error) {
      console.error("Error sending reply:", error);
      throw new Error("Gagal mengirim balasan: " + (error instanceof Error ? error.message : String(error)));
    }
  } catch (error) {
    console.error("Error replying to message:", error);
    return new Response(
      JSON.stringify({ 
        error: "Gagal membalas pesan",
        details: error instanceof Error ? error.message : String(error)
      }), 
      { status: 500 }
    );
  }
};

// Tambah fungsi untuk reconnect
export const reconnectWhatsApp = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  const { id } = await req.json();
  
  try {
    // Cek kepemilikan akun
    const account = await prisma.whatsAppAccount.findFirst({
      where: {
        id,
        userId: auth.userId
      }
    });

    if (!account) {
      return new Response(
        JSON.stringify({ error: "Akun WhatsApp tidak ditemukan" }), 
        { status: 404 }
      );
    }

    // Hapus client lama jika ada
    if (clients[id]) {
      try {
        await clients[id].destroy();
        // Tunggu sebentar untuk memastikan browser benar-benar tertutup
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.log("Error destroying old client:", error);
      }
      delete clients[id];
    }

    // Update status ke CONNECTING
    await prisma.whatsAppAccount.update({
      where: { id },
      data: { 
        status: "CONNECTING",
        qrCode: null
      }
    });

    // Inisialisasi client baru dengan timeout yang lebih lama
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: id,
        dataPath: './whatsapp-sessions'
      }),
      puppeteer: {
        headless: true,
        timeout: 120000, // 2 menit timeout
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-component-extensions-with-background-pages',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=site-per-process,TranslateUI',
          '--disable-ipc-flooding-protection'
        ]
      }
    });

    // Initialize client dengan error handling
    console.log("Reconnecting WhatsApp client...");
    try {
      // Set up event handlers terlebih dahulu
      let isQRReceived = false;
      let isReady = false;
      let isAuthenticated = false;
      let currentQRCode = null;
      
      // Event handler untuk QR code
      client.on("qr", async (qr) => {
        console.log("QR Code diterima, panjang:", qr.length);
        isQRReceived = true;
        currentQRCode = qr;
        
        try {
          console.log("Menyimpan QR code ke database...");
          await prisma.whatsAppAccount.update({
            where: { id },
            data: { 
              qrCode: qr,
              status: "CONNECTING" 
            },
          });
          
          console.log("Mengirim QR code ke user:", auth.userId);
          sendToUser(auth.userId, {
            type: "QR_CODE",
            whatsappId: id,
            qrCode: qr
          });
          
          console.log("QR code berhasil dikirim ke user");
        } catch (error) {
          console.error("Error saat menangani QR code:", error);
        }
      });

      // Event handler untuk ready
      client.on("ready", async () => {
        console.log("Client ready event received");
        isReady = true;
        
        try {
          // Update status dan hapus QR code
          await prisma.whatsAppAccount.update({
            where: { id },
            data: { 
              status: "CONNECTED",
              qrCode: null,
              lastActive: new Date()
            },
          });

          // Kirim notifikasi ke user
          sendToUser(auth.userId, {
            type: "STATUS_UPDATE",
            whatsappId: id,
            status: "CONNECTED"
          });

          // Simpan client ke daftar clients
          clients[id] = client;

          // Mulai interval pembaruan status
          const intervalId = startStatusUpdateInterval(client, id, auth.userId);
          client.on("disconnected", () => {
            clearInterval(intervalId);
          });
        } catch (error) {
          console.error("Error handling ready state:", error);
        }
      });

      // Event handler untuk authenticated
      client.on("authenticated", async () => {
        console.log("Client authenticated");
        isAuthenticated = true;
        
        try {
          // Update status dan hapus QR code
          await prisma.whatsAppAccount.update({
            where: { id },
            data: { 
              status: "CONNECTING",
              qrCode: null
            },
          });

          // Kirim notifikasi ke user
          sendToUser(auth.userId, {
            type: "STATUS_UPDATE",
            whatsappId: id,
            status: "CONNECTING"
          });
        } catch (error) {
          console.error("Error handling authentication:", error);
        }
      });

      // Event handler untuk pesan
      client.on("message", async (message) => {
        try {
          console.log("Message received:", {
            from: message.from,
            body: message.body,
            id: message.id._serialized
          });

          // Update lastActive
          await prisma.whatsAppAccount.update({
            where: { id },
            data: { lastActive: new Date() },
          });

          const account = await prisma.whatsAppAccount.findUnique({
            where: { id }
          });

          // Simpan pesan ke database
          const savedMessage = await prisma.whatsAppMessage.create({
            data: {
              id: message.id._serialized,
              message: message.body,
              sender: message.from,
              to: message.to || account?.phoneNumber || '',
              status: "RECEIVED",
              whatsAppAccount: {
                connect: { id }
              },
              user: {
                connect: { id: auth.userId }
              }
            }
          });

          console.log("Message saved to database:", savedMessage);

          // Kirim notifikasi ke user melalui WebSocket
          sendToUser(auth.userId, {
            type: "MESSAGE_RECEIVED",
            whatsappId: id,
            message: {
              id: message.id._serialized,
              from: message.from,
              to: message.to || account?.phoneNumber,
              body: message.body,
              timestamp: message.timestamp
            }
          });

          // Kirim webhook jika ada
          if (account?.webhookUrl) {
            try {
              await fetch(account.webhookUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  messageId: message.id._serialized,
                  from: message.from,
                  to: message.to || account.phoneNumber,
                  body: message.body,
                  timestamp: message.timestamp,
                })
              });
              console.log("Webhook delivered successfully");
            } catch (webhookError) {
              console.error('Webhook delivery failed:', webhookError);
            }
          }
        } catch (error) {
          console.error("Error handling incoming message:", error);
        }
      });

      // Setelah event handlers terpasang, baru initialize client
      console.log("Menginisialisasi WhatsApp client...");
      await client.initialize();
      console.log("WhatsApp client berhasil diinisialisasi");
      
      // Tunggu maksimal 60 detik untuk mendapatkan status
      let attempts = 0;
      const maxAttempts = 12; // 12 x 5 detik = 60 detik
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Tunggu 5 detik
        console.log(`Check attempt ${attempts + 1}:`, { 
          isQRReceived, 
          isReady,
          isAuthenticated,
          hasInfo: !!client.info,
          hasWid: !!client.info?.wid,
          hasQRCode: !!currentQRCode
        });
        
        try {
          // Cek status autentikasi terlebih dahulu
          if (!isAuthenticated) {
            const authState = await client.getState();
            console.log("Current auth state:", authState);
            
            // Jika sudah terautentikasi sebelumnya
            if (authState) {
              isAuthenticated = true;
            }
          }

          // Jika QR code diterima dan belum terautentikasi
          if (isQRReceived && !isAuthenticated) {
            console.log("QR Code telah diterima, menunggu scan...");
            
            // Pastikan QR code masih tersimpan di database
            if (currentQRCode) {
              await prisma.whatsAppAccount.update({
                where: { id },
                data: { 
                  qrCode: currentQRCode,
                  status: "CONNECTING" 
                },
              });
              
              // Kirim ulang QR code ke user
              sendToUser(auth.userId, {
                type: "QR_CODE",
                whatsappId: id,
                qrCode: currentQRCode
              });
            }
            
            return new Response(
              JSON.stringify({ 
                message: "Silakan scan QR code untuk menghubungkan WhatsApp",
                status: "WAITING_FOR_SCAN",
                hasQRCode: !!currentQRCode
              }), 
              { status: 200 }
            );
          }

          // Jika sudah terautentikasi, tunggu ready
          if (isAuthenticated) {
            // Hapus QR code dari database karena sudah tidak diperlukan
            await prisma.whatsAppAccount.update({
              where: { id },
              data: { qrCode: null }
            });
            
            // Coba dapatkan state
            const state = await client.getState();
            console.log("State after auth:", state);
            
            // Verifikasi koneksi
            if (state === 'CONNECTED' || (client.info?.wid && isReady)) {
              console.log("Connection verified successfully");
              return new Response(
                JSON.stringify({ message: "WhatsApp berhasil terhubung" }), 
                { status: 200 }
              );
            }
          }
        } catch (error) {
          console.log(`Check attempt ${attempts + 1} error:`, error);
        }
        
        attempts++;
      }
      
      // Jika masih menunggu QR scan
      if (isQRReceived && !isAuthenticated && currentQRCode) {
        return new Response(
          JSON.stringify({ 
            message: "Menunggu scan QR code",
            status: "WAITING_FOR_SCAN",
            hasQRCode: true
          }), 
          { status: 200 }
        );
      }

      // Jika timeout tercapai
      throw new Error("Gagal mendapatkan koneksi yang stabil: Timeout setelah 60 detik. Status: " + 
        JSON.stringify({ 
          isQRReceived, 
          isReady, 
          isAuthenticated, 
          hasInfo: !!client.info,
          hasQRCode: !!currentQRCode 
        }));
    } catch (error) {
      console.error("Error during client initialization:", error);
      // Cleanup jika gagal
      try {
        await client.destroy();
        delete clients[id];
        await prisma.whatsAppAccount.update({
          where: { id },
          data: { 
            status: "DISCONNECTED",
            qrCode: null
          }
        });
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }
      throw error;
    }

    return new Response(
      JSON.stringify({ message: "Proses reconnect dimulai" }), 
      { 
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("Error reconnecting WhatsApp:", error);
    return new Response(
      JSON.stringify({ error: "Gagal melakukan reconnect" }), 
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};

export const updateWebhook = async (req: Request, accountId: string) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    const { webhookUrl } = await req.json();

    const account = await prisma.whatsAppAccount.findFirst({
      where: {
        id: accountId,
        userId: auth.userId
      }
    });

    if (!account) {
      return new Response(
        JSON.stringify({ error: "Akun WhatsApp tidak ditemukan" }), 
        { status: 404 }
      );
    }

    await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: { webhookUrl }
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error updating webhook:", error);
    return new Response(
      JSON.stringify({ error: "Gagal mengupdate webhook" }), 
      { status: 500 }
    );
  }
};

// Fungsi untuk mendapatkan status WhatsApp dengan pengecekan mengirim/menerima pesan
export const getWhatsAppStatus = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  const id = req.url.split('/accounts/')[1]?.split('/')[0];
  if (!id) {
    return new Response(JSON.stringify({ error: "ID tidak valid" }), { status: 400 });
  }

  try {
    // Cek kepemilikan akun
    const account = await prisma.whatsAppAccount.findFirst({
      where: {
        id,
        userId: auth.userId
      }
    });

    if (!account) {
      return new Response(
        JSON.stringify({ error: "Akun WhatsApp tidak ditemukan" }), 
        { status: 404 }
      );
    }

    // Cek status dari client WhatsApp
    const client = clients[id];
    if (!client) {
      return new Response(
        JSON.stringify({ status: "DISCONNECTED" }), 
        { status: 200 }
      );
    }

    try {
      // Cek apakah client memiliki info yang valid (info berisi data aktif whatsapp)
      const isSessionActive = client.info && client.info.wid ? true : false;
      
      // Coba mendapatkan state untuk memastikan koneksi masih aktif
      const state = await client.getState();
      
      // Hanya dianggap terhubung jika session aktif dan state adalah CONNECTED
      const status = (isSessionActive && state === 'CONNECTED') ? "CONNECTED" : "DISCONNECTED";

      // Update status di database
      await prisma.whatsAppAccount.update({
        where: { id },
        data: { 
          status,
          lastActive: status === "CONNECTED" ? new Date() : undefined
        },
      });

      return new Response(
        JSON.stringify({ status }), 
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ status: "DISCONNECTED" }), 
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error) {
    console.error("Error getting WhatsApp status:", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan saat mengecek status" }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

export const getWebhookStatus = async (req: Request, accountId: string) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  const account = await prisma.whatsAppAccount.findFirst({
    where: {
      id: accountId,
      userId: auth.userId
    },
    select: {
      webhookUrl: true
    }
  });

  return new Response(
    JSON.stringify({ webhookUrl: account?.webhookUrl }), 
    { status: 200 }
  );
};