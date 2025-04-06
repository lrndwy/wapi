import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useWebSocket(onMessage: (data: any) => void) {
  const { token } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!token) {
      console.log("No token available for WebSocket connection");
      return;
    }

    const connectWebSocket = () => {
      try {
        console.log("Attempting to connect WebSocket...");
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:3030';
        const wsUrl = `${protocol}//${host}/ws`;
        console.log("WebSocket URL:", wsUrl);
        console.log("Using token:", token.substring(0, 10) + "...");
        
        const ws = new WebSocket(wsUrl, token);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected successfully");
          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = undefined;
          }
        };

        ws.onmessage = (event) => {
          console.log("WebSocket message received, data length:", event.data.length);
          try {
            const data = JSON.parse(event.data);
            console.log("Parsed WebSocket message:", {
              type: data.type,
              hasQRCode: data.type === "QR_CODE" && !!data.qrCode,
              qrCodeLength: data.type === "QR_CODE" ? data.qrCode?.length : undefined
            });
            
            // Tampilkan notifikasi browser untuk pesan masuk
            if (data.type === "MESSAGE_RECEIVED" && "Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification("Pesan WhatsApp Baru", {
                  body: `Dari: ${data.message.from.split('@')[0]}\n${data.message.body}`,
                });
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission();
              }
            }

            onMessage(data);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
            console.error("Raw message:", event.data);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        ws.onclose = (event) => {
          console.log("WebSocket connection closed:", event.code, event.reason);
          // Attempt to reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect WebSocket...");
            connectWebSocket();
          }, 5000);
        };
      } catch (error) {
        console.error("Error setting up WebSocket:", error);
      }
    };

    connectWebSocket();

    return () => {
      console.log("Cleaning up WebSocket connection...");
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [token, onMessage]);

  const isConnected = () => {
    const connected = wsRef.current?.readyState === WebSocket.OPEN;
    console.log("WebSocket connection status:", connected ? "Connected" : "Disconnected");
    return connected;
  };

  return {
    ws: wsRef.current,
    isConnected
  };
} 