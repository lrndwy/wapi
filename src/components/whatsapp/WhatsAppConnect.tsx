import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface WhatsAppConnectProps {
  onSuccess?: () => void;
}

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

export function WhatsAppConnect({ onSuccess }: WhatsAppConnectProps) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<string>("DISCONNECTED");
  const [isLoading, setIsLoading] = useState(false);
  const [whatsappId, setWhatsappId] = useState<string | null>(null);
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!whatsappId) return;

    console.log("Setting up WebSocket subscription for WhatsApp ID:", whatsappId);
    
    const unsubscribe = subscribe((data: any) => {
      console.log("WebSocket message received in WhatsAppConnect:", data);

      if (data.type === "QR_CODE" && data.whatsappId === whatsappId) {
        console.log("QR Code received for WhatsApp ID:", whatsappId);
        console.log("QR Code content:", data.qrCode?.slice(0, 20) + "...");
        setQrCode(data.qrCode);
        setStatus("CONNECTING");
        setIsLoading(false);
      } else if (data.type === "STATUS_UPDATE" && data.whatsappId === whatsappId) {
        console.log("Status update received for WhatsApp ID:", whatsappId);
        console.log("New status:", data.status);
        setStatus(data.status);
        
        if (data.status === "CONNECTED") {
          console.log("WhatsApp connected successfully");
          setQrCode(null);
          toast.success("WhatsApp berhasil terhubung!");
          onSuccess?.();
        } else if (data.status === "AUTH_FAILED") {
          console.log("WhatsApp authentication failed");
          setError("Autentikasi gagal. Silakan coba lagi.");
          setIsLoading(false);
        }
      }
    });

    // Cleanup subscription when component unmounts or whatsappId changes
    return () => {
      console.log("Cleaning up WebSocket subscription for WhatsApp ID:", whatsappId);
      unsubscribe();
    };
  }, [whatsappId, subscribe, onSuccess]);

  useEffect(() => {
    if (!isConnected && whatsappId) {
      console.log("WebSocket disconnected, showing warning");
      toast.warning("Koneksi terputus, mencoba menghubungkan kembali...");
    }
  }, [isConnected, whatsappId]);

  const handleConnect = async (e: React.FormEvent | null) => {
    if (e) e.preventDefault();
    console.log("Starting WhatsApp connection process...");
    setIsLoading(true);
    setError("");
    
    if (!isConnected) {
      setError("Tidak dapat menghubungkan WhatsApp: WebSocket tidak terhubung");
      setIsLoading(false);
      return;
    }
    
    try {
      console.log("Sending connection request...");
      const response = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      console.log("Connection response:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "Gagal menghubungkan WhatsApp");
      }

      setWhatsappId(data.whatsappId);
      console.log("WhatsApp connection initiated, waiting for QR code...");
      setStatus("CONNECTING");
    } catch (err) {
      console.error("Connection error:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hubungkan WhatsApp</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <Input
              placeholder="Nama untuk identifikasi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading || status === "CONNECTED"}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {!isConnected && (
            <div className="text-yellow-500 text-sm">
              Menunggu koneksi WebSocket...
            </div>
          )}

          {status !== "CONNECTED" && (
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !name || !isConnected}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menghubungkan...
                </>
              ) : (
                "Hubungkan"
              )}
            </Button>
          )}

          {qrCode && (
            <div className="flex flex-col items-center space-y-4">
              <div className="border-2 p-6 rounded-lg bg-white shadow-lg">
                <QRCodeSVG 
                  value={qrCode} 
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan QR code ini dengan WhatsApp di ponsel Anda untuk menghubungkan
              </p>
            </div>
          )}

          {status && (
            <div className="flex justify-center mt-4">
              <Badge variant={getStatusBadgeVariant(status)}>
                {status === "CONNECTED" ? "Terhubung" : 
                 status === "CONNECTING" ? "Menghubungkan..." : 
                 "Tidak Terhubung"}
              </Badge>
            </div>
          )}

          {isLoading && !qrCode && (
            <div className="flex justify-center mt-4">
              <p className="text-sm text-muted-foreground">
                Menunggu QR code...
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 