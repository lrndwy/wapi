import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Navigate, useNavigate } from "react-router-dom";
import { WhatsAppConnect } from "@/components/whatsapp/WhatsAppConnect";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsAppAPIDoc } from "@/components/whatsapp/WhatsAppAPIDoc";
import { WhatsAppMessages } from "@/components/whatsapp/WhatsAppMessages";
import { X, Loader2, ArrowRight, MoreVertical, MessageCircle, User, Shield, Trash, ArrowRightIcon, Plus } from "lucide-react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WhatsAppAccount {
  id: string;
  name: string;
  status: string;
  lastActive: string | null;
  apiKey: string;
}

interface UserPlan {
  maxAccounts: number;
  features: {
    canAddMoreAccounts: boolean;
    hasWebhookAccess: boolean;
    hasAdvancedApi: boolean;
  };
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
const getStatusBadgeVariant = (status: string, lastActive: string | null) => {
  if (status === "CONNECTED") {
    return isAccountActive(lastActive) ? "success" : "error";
  }
  return "error";
};

// Fungsi untuk mendapatkan teks status yang sederhana
const getStatusText = (status: string, lastActive: string | null) => {
  if (status === "CONNECTED") {
    return isAccountActive(lastActive) ? "Aktif" : "Tidak Aktif";
  }
  return "Tidak Aktif";
};

export function DashboardPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [showConnect, setShowConnect] = useState(false);
  const [showApiDocs, setShowApiDocs] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [reconnecting, setReconnecting] = useState<string | null>(null);
  const { subscribe } = useWebSocket();
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);

  // Effect untuk fetch user plan
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

  // Fungsi untuk mengecek status semua akun
  const checkAllAccountsStatus = useCallback(async () => {
    if (!accounts.length || !token) return;

    for (const account of accounts) {
      try {
        console.log(`Checking status for account ${account.id}...`);
        const response = await fetch(`/api/whatsapp/accounts/${account.id}/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Accept": "application/json",
          },
        });

        // Log response status
        console.log(`Status check response for ${account.id}:`, response.status);
        
        // Jika response bukan OK, throw error
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Coba parse response sebagai JSON
        const data = await response.json();

        // Log parsed data
        console.log(`Status data for ${account.id}:`, data);

        if (data.status) {
          setAccounts(prevAccounts =>
            prevAccounts.map(acc =>
              acc.id === account.id
                ? { 
                    ...acc, 
                    status: data.status,
                    lastActive: data.status === "CONNECTED" ? new Date().toISOString() : acc.lastActive 
                  }
                : acc
            )
          );
          console.log(`Successfully updated status for account ${account.id} to ${data.status}`);
        }
      } catch (error) {
        console.error(`Error checking status for account ${account.id}:`, error);
        // Jika terjadi error, set status account menjadi "ERROR"
        setAccounts(prevAccounts =>
          prevAccounts.map(acc =>
            acc.id === account.id
              ? { 
                  ...acc, 
                  status: "ERROR",
                  lastActive: null
                }
              : acc
          )
        );
      }
    }
  }, [accounts, token]);

  // Effect untuk fetch accounts awal
  useEffect(() => {
    fetchAccounts();
  }, [token]);

  // Effect untuk WebSocket subscription
  useEffect(() => {
    const handleWebSocketMessage = (data: any) => {
      console.log("WebSocket message received:", data);
      
      if (data.type === "STATUS_UPDATE") {
        console.log("Status update received:", data);
        setAccounts(prevAccounts => 
          prevAccounts.map(account => 
            account.id === data.whatsappId 
              ? { 
                  ...account, 
                  status: data.status, 
                  lastActive: data.status === "CONNECTED" ? new Date().toISOString() : account.lastActive 
                }
              : account
          )
        );
      } else if (data.type === "QR_CODE") {
        console.log("QR code received for account:", data.whatsappId);
        setAccounts(prevAccounts =>
          prevAccounts.map(account =>
            account.id === data.whatsappId
              ? {
                  ...account,
                  qrCode: data.qrCode,
                  status: "CONNECTING"
                }
              : account
          )
        );
      } else if (data.type === "MESSAGE_RECEIVED") {
        console.log("Message received:", data);
        // Refresh account status when message is received
        checkAllAccountsStatus();
      }
    };

    subscribe(handleWebSocketMessage);
    
    // Cleanup function
    return () => {
      // No need to check or call unsubscribe
    };
  }, [subscribe, checkAllAccountsStatus]);

  // Effect untuk polling status - kurangi interval menjadi 10 detik
  useEffect(() => {
    // Cek status segera setelah accounts berubah
    if (accounts.length > 0) {
      checkAllAccountsStatus();
    }

    // Set up polling dengan interval 10 detik
    const statusCheckInterval = setInterval(() => {
      if (accounts.length > 0) {
        checkAllAccountsStatus();
      }
    }, 10000);

    return () => {
      clearInterval(statusCheckInterval);
    };
  }, [accounts, checkAllAccountsStatus]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/whatsapp/accounts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const handleDelete = async (accountId: string) => {
    try {
      const response = await fetch("/api/whatsapp/accounts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: accountId }),
      });

      if (response.ok) {
        fetchAccounts();
        toast.success("Akun WhatsApp berhasil dihapus");
      } else {
        const data = await response.json();
        toast.error(data.error || "Gagal menghapus akun WhatsApp");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Terjadi kesalahan saat menghapus akun");
    } finally {
      setAccountToDelete(null);
    }
  };

  const handleShowAPI = async (accountId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/accounts/${accountId}/apikey`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setApiKeys(prev => ({
          ...prev,
          [accountId]: data.apiKey
        }));
        setShowApiDocs(accountId);
      }
    } catch (error) {
      console.error("Error fetching API key:", error);
    }
  };

  const handleReconnect = async (accountId: string) => {
    try {
      setReconnecting(accountId);
      const response = await fetch("/api/whatsapp/reconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: accountId }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Gagal menghubungkan ulang WhatsApp");
      }
    } catch (error) {
      console.error("Error reconnecting:", error);
      toast.error("Terjadi kesalahan saat menghubungkan ulang");
    } finally {
      setReconnecting(null);
      toast.success("WhatsApp berhasil terhubung kembali");
    }
  };

  const handleShowConnect = () => {
    if (!userPlan) {
      toast.error("Tidak dapat memuat informasi paket");
      return;
    }

    if (accounts.length >= userPlan.maxAccounts) {
      toast.error("Anda telah mencapai batas maksimum akun WhatsApp");
      return;
    }

    setShowConnect(true);
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Kelola akun WhatsApp Anda</p>
            </div>
          </div>

          {/* WhatsApp Accounts Section */}
          <div className="w-full flex flex-col">
            <div className="flex flex-row items-center justify-between border-b pb-6">
              <div>
                <CardTitle className="text-xl">Akun WhatsApp</CardTitle>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between w-64">
                    <span className="text-sm text-muted-foreground">Akun Digunakan</span>
                    <span className={`text-sm ${accounts.length >= (userPlan?.maxAccounts || 0) ? "text-red-600" : "text-green-600"}`}>
                      {accounts.length} / {userPlan?.maxAccounts || 0}
                    </span>
                  </div>
                  <div className="w-64 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        accounts.length >= (userPlan?.maxAccounts || 0)
                          ? "bg-red-600" 
                          : "bg-green-600"
                      }`}
                      style={{ 
                        width: `${Math.min(
                          userPlan?.maxAccounts ? (accounts.length / userPlan.maxAccounts) * 100 : 0, 
                          100
                        )}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleShowConnect} 
                className="bg-primary hover:bg-primary/90"
                disabled={!userPlan || accounts.length >= (userPlan?.maxAccounts || 0)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Akun
              </Button>
            </div>
            <div className="pt-6">
              {accounts.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">Belum ada akun WhatsApp yang terhubung</p>
                  <Button 
                    variant="link" 
                    onClick={() => setShowConnect(true)}
                    className="mt-2"
                  >
                    Tambah akun sekarang
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map((account) => (
                    <Card 
                      key={account.id}
                      className="border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-lg">{account.name}</h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setAccountToDelete(account.id)}
                              >
                                <Trash className="ml-2 h-4 w-4 text-red-600" />
                                Hapus
                                
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={getStatusBadgeVariant(account.status, account.lastActive)}
                              className="font-normal"
                            >
                              {getStatusText(account.status, account.lastActive)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {account.status === "CONNECTED" && formatLastActive(account.lastActive)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MessageCircle className="h-4 w-4" />
                            <span>ID: {account.id.slice(0, 8)}...</span>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/whatsapp/${account.id}`)}
                            className="w-full"
                          >
                            
                            Detail
                            <ArrowRightIcon className="mr-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dialog untuk menambah akun WhatsApp baru */}
          {showConnect && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
              <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90%] max-w-[600px]">
                <WhatsAppConnect onSuccess={() => {
                  setShowConnect(false);
                  fetchAccounts();
                }} />
                <X 
                  className="absolute top-5 right-6 h-5 w-5 cursor-pointer hover:opacity-70"
                  onClick={() => setShowConnect(false)}
                />
              </div>
            </div>
          )}

          {/* Tampilkan dokumentasi API untuk akun yang dipilih */}
          {showApiDocs && (
            <WhatsAppAPIDoc 
              accountId={showApiDocs}
              apiKey={apiKeys[showApiDocs] || ''} 
            />
          )}

          {/* Dialog Konfirmasi Hapus */}
          {accountToDelete && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
              <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90%] max-w-[400px]">
                <Card>
                  <CardHeader>
                    <CardTitle>Konfirmasi Hapus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Anda yakin ingin menghapus akun WhatsApp ini?</p>
                  </CardContent>
                  <div className="flex justify-end gap-2 p-6 pt-0">
                    <Button
                      variant="outline"
                      onClick={() => setAccountToDelete(null)}
                    >
                      Batal
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(accountToDelete)}
                    >
                      Hapus
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 