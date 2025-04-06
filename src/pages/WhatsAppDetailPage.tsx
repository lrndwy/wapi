import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WhatsAppMessages } from "@/components/whatsapp/WhatsAppMessages";
import { WhatsAppAPIDoc } from "@/components/whatsapp/WhatsAppAPIDoc";
import { Loader2, ArrowLeft } from "lucide-react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";

interface WhatsAppAccount {
  id: string;
  name: string;
  status: string;
  lastActive: string | null;
  apiKey: string;
  phoneNumber: string;
  webhookUrl: string;
  qrCode: string | null;
  messages: Message[];
}

interface UserPlan {
  features: {
    hasWebhookAccess: boolean;
    hasAdvancedApi: boolean;
  };
}

interface Message {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
  message: string;
  to: string;
  status: string;
}

// Fungsi untuk mengecek apakah akun aktif (bisa mengirim/menerima pesan)
const isAccountActive = (lastActive: string | null): boolean => {
  if (!lastActive) return false;
  
  const lastActiveDate = new Date(lastActive);
  const now = new Date();
  
  // Jika last active dalam 30 menit terakhir, anggap masih aktif
  const diffInMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60));
  return diffInMinutes < 30;
};

// Fungsi untuk memformat waktu terakhir aktif
const formatLastActive = (lastActive: string | null) => {
  if (!lastActive) return "Tidak tersedia";
  
  const lastActiveDate = new Date(lastActive);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - lastActiveDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "Baru saja aktif";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Aktif ${minutes} menit yang lalu`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Aktif ${hours} jam yang lalu`;
  } else {
    return `Aktif pada ${lastActiveDate.toLocaleString()}`;
  }
};

// Modifikasi fungsi getStatusBadgeVariant
const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (status) {
    case "CONNECTED":
      return "default";
    case "CONNECTING":
      return "secondary";
    default:
      return "destructive";
  }
};

// Fungsi untuk mendapatkan teks status yang sederhana
const getStatusText = (status: string, lastActive: string | null) => {
  if (status === "CONNECTED") {
    return isAccountActive(lastActive) ? "Aktif" : "Tidak Aktif";
  }
  return "Tidak Aktif";
};

export function WhatsAppDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [account, setAccount] = useState<WhatsAppAccount | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const { subscribe } = useWebSocket();
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch("/api/subscription", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setUserPlan(data.subscription);
        }
      } catch (error) {
        console.error("Error fetching user plan:", error);
      }
    };

    if (token) {
      fetchUserPlan();
    }
  }, [token]);

  useEffect(() => {
    if (id && token) {
      fetchData();
      fetchApiKey();
    }
    
    const handleWebSocketMessage = (data: any) => {
      console.log("[WhatsAppDetailPage] WebSocket message received:", {
        type: data.type,
        whatsappId: data.whatsappId,
        currentId: id,
        hasQRCode: !!data.qrCode,
        status: data.status
      });
      
      if (data.type === "QR_CODE" && data.whatsappId === id) {
        console.log("[WhatsAppDetailPage] Processing QR Code:", {
          qrLength: data.qrCode?.length,
          isValid: !!data.qrCode
        });
        
        if (data.qrCode) {
          setQRCodeData(data.qrCode);
          setShowQRCode(true);
          console.log("[WhatsAppDetailPage] QR Code state updated");
        }
      } else if (data.type === "STATUS_UPDATE" && data.whatsappId === id) {
        console.log("[WhatsAppDetailPage] Processing status update:", data.status);
        
        if (data.status === "CONNECTED") {
          setShowQRCode(false);
          setQRCodeData(null);
          console.log("[WhatsAppDetailPage] QR Code hidden due to CONNECTED status");
        } else if (data.status === "CONNECTING") {
          console.log("[WhatsAppDetailPage] Device is in CONNECTING state");
        }
        
        setAccount(prev => {
          const updated = prev ? {
            ...prev,
            status: data.status,
            lastActive: new Date().toISOString()
          } : null;
          console.log("[WhatsAppDetailPage] Account state updated:", {
            status: updated?.status,
            lastActive: updated?.lastActive
          });
          return updated;
        });
      } else if (data.type === "MESSAGE_RECEIVED" && data.whatsappId === id) {
        console.log("[WhatsAppDetailPage] New message received:", data.message);
        
        setMessages(prevMessages => {
          // Cek apakah pesan dengan ID yang sama sudah ada
          const isDuplicate = prevMessages.some(msg => msg.id === data.message.id);
          if (isDuplicate) {
            return prevMessages;
          }
          
          // Tambahkan pesan baru ke awal array
          const newMessage = {
            id: data.message.id,
            content: data.message.body,
            sender: data.message.from,
            createdAt: new Date(data.message.timestamp * 1000).toISOString(),
            message: data.message.body,
            to: data.message.to || account?.phoneNumber || '',
            status: "RECEIVED"
          };
          
          console.log("[WhatsAppDetailPage] Adding new message:", newMessage);
          return [newMessage, ...prevMessages].slice(0, 50);
        });
      }
    };

    console.log("[WhatsAppDetailPage] Setting up WebSocket subscription");
    subscribe(handleWebSocketMessage);
  }, [id, token, subscribe, account?.phoneNumber]);

  const fetchData = async () => {
    try {
      console.log("[WhatsAppDetailPage] Fetching account data");
      const accountResponse = await fetch(`/api/whatsapp/accounts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const accountData = await accountResponse.json();
      
      if (accountResponse.ok) {
        console.log("[WhatsAppDetailPage] Account data received:", {
          status: accountData.status,
          hasQRCode: !!accountData.qrCode
        });
        
        setAccount(accountData);
        setWebhookUrl(accountData.webhookUrl || '');
        
        // Jika ada QR code yang tersimpan, tampilkan
        if (accountData.qrCode) {
          console.log("[WhatsAppDetailPage] Displaying saved QR Code");
          setQRCodeData(accountData.qrCode);
          setShowQRCode(true);
        }

        // Ambil pesan-pesan terakhir
        const messagesResponse = await fetch(`/api/whatsapp/accounts/${id}/messages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          console.log("[WhatsAppDetailPage] Messages loaded:", messagesData.length);
          setMessages(messagesData);
        }
      }
    } catch (error) {
      console.error("[WhatsAppDetailPage] Error fetching data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKey = async () => {
    try {
      const response = await fetch(`/api/whatsapp/accounts/${id}/apikey`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setApiKey(data.apiKey);
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
      toast.error("Gagal memuat API key");
    }
  };

  const handleReconnect = async () => {
    try {
      setReconnecting(true);
      console.log("[WhatsAppDetailPage] Initiating reconnect for account:", id);
      
      const response = await fetch("/api/whatsapp/reconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Gagal menghubungkan ulang WhatsApp");
        console.error("[WhatsAppDetailPage] Reconnect failed:", data);
      } else {
        console.log("[WhatsAppDetailPage] Reconnect initiated successfully");
        // Tampilkan pesan menunggu QR code
        toast.info("Menunggu QR code...");
      }
    } catch (error) {
      console.error("[WhatsAppDetailPage] Error during reconnect:", error);
      toast.error("Terjadi kesalahan saat menghubungkan ulang");
    } finally {
      setReconnecting(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!userPlan?.features.hasWebhookAccess) {
      toast.error("Fitur webhook hanya tersedia untuk paket Professional dan Enterprise");
      return;
    }

    try {
      const response = await fetch(`/api/whatsapp/accounts/${id}/webhook`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ webhookUrl })
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan webhook');
      }

      toast.success("Webhook berhasil disimpan");
      await fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error("Gagal menyimpan webhook");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!account && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Akun tidak ditemukan</h1>
        <Button onClick={() => navigate('/dashboard')}>Kembali ke Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Detail WhatsApp</h1>
                <p className="text-muted-foreground mt-1">
                  {account?.name || 'Memuat...'}
                </p>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          {showQRCode && qrCodeData && (
            <Card>
              <CardHeader>
                <CardTitle>Scan QR Code</CardTitle>
                <CardDescription>
                  Buka WhatsApp di ponsel Anda dan pindai QR code ini untuk menghubungkan
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center p-8">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <QRCodeSVG
                    value={qrCodeData}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Section */}
          <Card>
            <CardHeader>
              <CardTitle>Status Koneksi</CardTitle>
              <CardDescription>
                Status koneksi WhatsApp saat ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Loading State */}
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Connection Status */}
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge variant={getStatusBadgeVariant(account?.status || "DISCONNECTED")}>
                        {account?.status === "CONNECTED" ? "Terhubung" : 
                         account?.status === "CONNECTING" ? "Menghubungkan" : 
                         "Tidak Terhubung"}
                      </Badge>
                    </div>

                    {/* Last Active */}
                    {account?.lastActive && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Terakhir Aktif:</span>
                        <span className="text-muted-foreground">
                          {formatLastActive(account.lastActive)}
                        </span>
                      </div>
                    )}

                    {/* Reconnect Button */}
                    <div className="flex justify-end mt-4">
                      <Button
                        onClick={handleReconnect}
                        disabled={reconnecting || account?.status === "CONNECTING"}
                      >
                        {reconnecting || account?.status === "CONNECTING" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Menghubungkan...
                          </>
                        ) : (
                          "Hubungkan Ulang"
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pesan Masuk */}
          <Card>
            <CardHeader>
              <CardTitle>Pesan Masuk</CardTitle>
              <CardDescription>50 pesan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={`${message.id}-${index}`}
                        className="p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setSelectedMessage(message)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium">{message.sender}</span>
                            <span className="text-sm text-gray-500 ml-2">→</span>
                            <span className="text-sm ml-2">{message.to}</span>
                          </div>
                          <Badge variant={message.status === "SENT" ? "success" : "default"}>
                            {message.status}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{message.content}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Belum ada pesan masuk
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Webhook Section */}
          <Card>
            <CardHeader>
              <CardTitle>Webhook</CardTitle>
              <CardDescription>
                {userPlan?.features.hasWebhookAccess 
                  ? "Atur webhook untuk menerima notifikasi pesan masuk"
                  : "Fitur webhook hanya tersedia untuk paket Professional dan Enterprise"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="webhook">URL Webhook</Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhook"
                      placeholder="https://example.com/webhook"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      disabled={!userPlan?.features.hasWebhookAccess}
                    />
                    <Button 
                      onClick={handleSaveWebhook}
                      disabled={!userPlan?.features.hasWebhookAccess}
                    >
                      Simpan
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 max-w-7xl mx-auto space-y-8">
          {/* Dokumentasi API */}
          <WhatsAppAPIDoc accountId={account.id} apiKey={apiKey} />
        </div>

        {/* Tambahkan Dialog untuk detail pesan */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-7xl w-[95vw] p-6 sm:p-8">
            <DialogHeader className="mb-6">
              <DialogTitle>Detail Pesan</DialogTitle>
              <DialogDescription>
                Informasi lengkap tentang pesan
              </DialogDescription>
            </DialogHeader>
            
            {selectedMessage && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-8">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Pengirim</h4>
                    <p className="text-sm break-all">{selectedMessage.sender}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Penerima</h4>
                    <p className="text-sm break-all">{selectedMessage.to}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Status</h4>
                    <Badge variant={selectedMessage.status === "SENT" ? "success" : "default"}>
                      {selectedMessage.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Waktu</h4>
                  <p className="text-sm">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <div className="w-full">
                  <h4 className="text-sm font-medium mb-2">Pesan</h4>
                  <div className="w-full">
                    <p className="text-sm p-6 bg-gray-50 rounded-md min-h-[100px] whitespace-pre-wrap w-full">
                      {selectedMessage.content}
                    </p>
                  </div>
                </div>
                
                <div className="w-full">
                  <h4 className="text-sm font-medium mb-2">Message ID</h4>
                  <div className="flex flex-col items-center gap-3 w-full">
                    <code className="text-xs bg-gray-100 p-4 rounded flex-1 overflow-x-auto font-mono w-full">
                      {selectedMessage.id}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedMessage.id);
                        toast.success("ID berhasil disalin!");
                      }}
                    >
                      Salin
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 