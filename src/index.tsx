import { serve } from "bun";
import index from "./index.html";
import { register, login } from "./api/controllers/auth";
import { connectWhatsApp, getWhatsAppAccounts, deleteWhatsAppAccount, getOrCreateAPIKey, sendWhatsAppMessage, replyWhatsAppMessage, reconnectWhatsApp, updateWebhook, getWhatsAppStatus } from "./api/controllers/whatsapp";
import { authMiddleware } from "./api/middleware/auth";
import type { JWTPayload } from "./api/middleware/auth";
import { verify } from "jsonwebtoken";
import type { ServerWebSocket } from "bun";
import { PrismaClient } from "@prisma/client";
import { updateProfile, updateUser, getUserProfile } from "@/api/controllers/users";
import { 
  getUsers, updateUserPlan, toggleUserStatus, 
  createUser, deleteUser,
  getPlans, createPlan, updatePlan, deletePlan, getAuditLogs,
  getPlan
} from "@/api/controllers/admin";
import { getWebhookStatus } from "@/api/controllers/whatsapp";
import { changePlan } from "./api/controllers/subscription";
import { getCurrentSubscription } from "./api/controllers/subscription";
import { getUsageStats } from "./api/controllers/subscription";
import { getUser } from "./api/controllers/users";
import { getAllPlans } from "@/api/controllers/plans";
import { compare, hash } from "bcryptjs";

const prisma = new PrismaClient();

interface WebSocketData {
  protocol?: string;
  userId?: string;
}

// Tambahkan fungsi untuk mendapatkan detail akun WhatsApp
export const getWhatsAppAccountDetail = async (req: Request, accountId: string) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
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

    return new Response(JSON.stringify(account), { status: 200 });
  } catch (error) {
    console.error("Error fetching WhatsApp account:", error);
    return new Response(
      JSON.stringify({ error: "Gagal mengambil detail akun WhatsApp" }), 
      { status: 500 }
    );
  }
};

// Tambahkan fungsi untuk mendapatkan pesan masuk
export const getWhatsAppMessages = async (req: Request, accountId: string) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        whatsAppAccountId: accountId,
        userId: auth.userId,
        status: "SENT"
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    return new Response(JSON.stringify(messages), { status: 200 });
  } catch (error) {
    console.error("Error fetching WhatsApp messages:", error);
    return new Response(
      JSON.stringify({ error: "Gagal mengambil pesan WhatsApp" }), 
      { status: 500 }
    );
  }
};

// Fungsi untuk mengirim pesan ke user melalui WebSocket
export const sendToUser = (userId: string, message: any) => {
  console.log("Attempting to send message to user:", userId);
  console.log("Message:", message);
  
  try {
    server.publish("user:" + userId, JSON.stringify(message));
    console.log("Message sent successfully to user:", userId);
  } catch (error) {
    console.error("Error sending message to user:", userId, error);
  }
};

const server = serve({
  port: 3030,
  websocket: {
    message: (ws: ServerWebSocket<WebSocketData>, message: string) => {
      console.log("WebSocket message received:", message);
      try {
        const parsedMessage = JSON.parse(message);
        console.log("Parsed WebSocket message:", parsedMessage);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    },
    open: (ws: ServerWebSocket<WebSocketData>) => {
      console.log("WebSocket connection opened");
      const token = ws.data.protocol;
      if (!token) {
        console.log("No token provided, closing connection");
        ws.close(1008, "Unauthorized");
        return;
      }

      try {
        console.log("Verifying token...");
        const decoded = verify(token, process.env.JWT_SECRET!) as JWTPayload;
        ws.data.userId = decoded.userId;
        console.log("User authenticated:", decoded.userId);
        ws.subscribe("user:" + decoded.userId);
        console.log("Subscribed to user channel:", "user:" + decoded.userId);
      } catch (error) {
        console.error("Invalid token:", error);
        ws.close(1008, "Invalid token");
      }
    },
    close: (ws: ServerWebSocket<WebSocketData>) => {
      console.log("WebSocket connection closed for user:", ws.data.userId);
    }
  },
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    // Auth routes
    "/api/auth/register": {
      POST: register
    },
    "/api/auth/login": {
      POST: login
    },

    // WhatsApp routes
    "/api/whatsapp/connect": {
      POST: connectWhatsApp
    },
    "/api/whatsapp/accounts": {
      GET: getWhatsAppAccounts,
      DELETE: deleteWhatsAppAccount
    },
    "/api/whatsapp/accounts/:id/status": {
      GET: getWhatsAppStatus
    },
    "/api/whatsapp/accounts/:id/apikey": {
      GET: async (req) => {
        // Extract ID from URL
        const id = req.url.split('/accounts/')[1].split('/apikey')[0];
        // Create new request with ID
        const newReq = new Request(req.url, {
          headers: req.headers,
        });
        return getOrCreateAPIKey(newReq, id);
      }
    },
    "/api/whatsapp/messages": {
      POST: sendWhatsAppMessage
    },
    "/api/whatsapp/reply": {
      POST: replyWhatsAppMessage
    },
    "/api/whatsapp/accounts/:id/messages": {
      GET: async (req) => {
        const id = req.url.split('/accounts/')[1].split('/messages')[0];
        return getWhatsAppMessages(req, id);
      }
    },
    "/api/whatsapp/accounts/:id/webhook": {
      PUT: async (req) => {
        const id = req.url.split('/accounts/')[1].split('/webhook')[0];
        return updateWebhook(req, id);
      },
      GET: async (req) => {
        const id = req.url.split('/accounts/')[1].split('/webhook')[0];
        return getWebhookStatus(req, id);
      }
    },

    // Tambahkan route baru untuk detail akun WhatsApp
    "/api/whatsapp/accounts/:id": {
      GET: async (req) => {
        const id = req.url.split('/accounts/')[1];
        return getWhatsAppAccountDetail(req, id);
      }
    },

    // Tambah route untuk subscription/plan
    "/api/subscription": {
      GET: async (req) => {
        const auth = await authMiddleware(req);
        if (auth instanceof Response) return auth;
        return getCurrentSubscription(req);
      }
    },
    
    "/api/subscription/change-plan": {
      POST: changePlan
    },

    "/api/subscription/usage": {
      GET: async (req) => {
        const auth = await authMiddleware(req);
        if (auth instanceof Response) return auth;
        return getUsageStats(req);
      }
    },

    // Route untuk mengambil daftar paket
    "/api/plans": {
      GET: getAllPlans
    },

    // Update route admin
    "/api/admin/users": {
      GET: getUsers,
      POST: createUser
    },

    "/api/admin/users/:id": {
      GET: async (req) => {
        return getUser(req);
      },
      PUT: async (req) => {
        return updateUser(req);
      },
      DELETE: async (req) => {
        return deleteUser(req);
      }
    },

    "/api/admin/users/:id/plan": {
      PUT: async (req) => {
        return updateUserPlan(req);
      }
    },

    "/api/admin/users/:id/status": {
      PUT: async (req) => {
        return toggleUserStatus(req);
      }
    },

    "/api/admin/plans": {
      GET: getPlans,
      POST: createPlan
    },

    "/api/admin/plans/:id": {
      GET: async (req) => {
        return getPlan(req);
      },
      PUT: async (req) => {
        return updatePlan(req);
      },
      DELETE: async (req) => {
        return deletePlan(req);
      }
    },

    "/api/admin/audit-logs": {
      GET: getAuditLogs
    },

    // Protected route example
    "/api/me": {
      GET: async (req) => {
        const auth = await authMiddleware(req);
        if (auth instanceof Response) return auth;
        return Response.json({
          message: "Protected route accessed successfully",
          user: auth
        });
      }
    },

    // WebSocket endpoint
    "/ws": {
      GET: (req, server) => {
        const upgraded = server.upgrade(req, {
          data: { protocol: req.headers.get("sec-websocket-protocol") }
        });
        if (!upgraded) {
          return new Response("Upgrade failed", { status: 400 });
        }
      }
    },

    "/api/users/profile": {
      GET: getUserProfile,
      PUT: updateProfile
    },

    // Tambahkan route untuk update password
    "/api/users/password": {
      PUT: async (req) => {
        const auth = await authMiddleware(req);
        if (auth instanceof Response) return auth;
        
        try {
          const { currentPassword, newPassword } = await req.json();
          
          // Validasi input
          if (!currentPassword || !newPassword) {
            return new Response(
              JSON.stringify({ error: "Password lama dan baru harus diisi" }), 
              { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }

          // Ambil user dari database
          const user = await prisma.user.findUnique({
            where: { id: auth.userId }
          });

          if (!user) {
            return new Response(
              JSON.stringify({ error: "Pengguna tidak ditemukan" }), 
              { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }

          // Verifikasi password lama
          const isPasswordValid = await compare(currentPassword, user.password);
          if (!isPasswordValid) {
            return new Response(
              JSON.stringify({ error: "Password lama tidak sesuai" }), 
              { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }

          // Hash password baru
          const hashedPassword = await hash(newPassword, 10);

          // Update password
          await prisma.user.update({
            where: { id: auth.userId },
            data: { password: hashedPassword }
          });

          return new Response(
            JSON.stringify({ 
              message: "Password berhasil diperbarui",
              success: true 
            }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } catch (error) {
          console.error("Error updating password:", error);
          return new Response(
            JSON.stringify({ 
              error: "Terjadi kesalahan server",
              details: error instanceof Error ? error.message : 'Unknown error'
            }), 
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }
    },

    // Tambahkan route untuk reconnect
    "/api/whatsapp/reconnect": {
      POST: async (req) => {
        return await reconnectWhatsApp(req);
      }
    },
  },

  development: process.env.NODE_ENV !== "production",
});

export { server };

console.log(`🚀 Server running at ${server.url}`);