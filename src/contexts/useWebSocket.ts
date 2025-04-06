import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const getWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  return `${protocol}//${host}${port ? `:${port}` : ''}/ws`;
};

export const useWebSocket = () => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_INTERVAL = 3000; // 3 detik
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const CONNECTION_TIMEOUT = 5000; // 5 detik timeout untuk koneksi

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = undefined;
    }
    if (wsRef.current) {
      console.log("Cleaning up WebSocket connection...");
      try {
        wsRef.current.close(1000, "Cleanup"); // Clean close
      } catch (error) {
        console.error("Error closing WebSocket:", error);
      }
      wsRef.current = null;
    }
    setIsConnecting(false);
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (isConnecting || !token) return;

    try {
      cleanup(); // Bersihkan koneksi sebelumnya
      setIsConnecting(true);
      console.log("Attempting to connect WebSocket...");

      const wsUrl = getWebSocketUrl();
      console.log("WebSocket URL:", wsUrl);
      console.log("Using token:", token?.slice(0, 10) + "...");

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        console.log("WebSocket connection timeout");
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
        }
      }, CONNECTION_TIMEOUT);

      ws.onopen = () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = undefined;
        }
        
        console.log("WebSocket connected successfully");
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        
        try {
          ws.send(JSON.stringify({ type: "AUTH", token }));
        } catch (error) {
          console.error("Error sending authentication token:", error);
          cleanup();
          return;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", {
            type: data.type,
            success: data.success,
            error: data.error
          });
          
          if (data.type === "AUTH_RESPONSE") {
            if (data.success) {
              console.log("WebSocket authentication successful");
            } else {
              console.error("WebSocket authentication failed:", data.error);
              cleanup();
            }
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        cleanup();
        
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          console.log(`Error occurred, attempting to reconnect... (${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, RECONNECT_INTERVAL);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket connection closed:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        cleanup();

        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          console.log(`Attempting to reconnect... (${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, RECONNECT_INTERVAL);
        } else if (event.code !== 1000) {
          console.log("Max reconnection attempts reached");
        }
      };

      return cleanup;
    } catch (error) {
      console.error("Error setting up WebSocket:", error);
      cleanup();
    }
  }, [token, isConnecting, cleanup]);

  useEffect(() => {
    if (token && !isConnected && !isConnecting) {
      const cleanupFn = connect();
      return () => {
        if (cleanupFn) cleanupFn();
      };
    }
    return cleanup;
  }, [token, connect, isConnected, isConnecting, cleanup]);

  const subscribe = useCallback((callback: (data: any) => void) => {
    if (!wsRef.current) {
      console.warn("WebSocket not connected when attempting to subscribe");
      return;
    }

    const messageHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    };

    wsRef.current.addEventListener('message', messageHandler);

    return () => {
      if (wsRef.current) {
        wsRef.current.removeEventListener('message', messageHandler);
      }
    };
  }, []);

  const send = useCallback((data: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("Cannot send message - WebSocket not connected");
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Error sending WebSocket message:", error);
      return false;
    }
  }, []);

  return {
    isConnected,
    isConnecting,
    subscribe,
    send
  };
}; 