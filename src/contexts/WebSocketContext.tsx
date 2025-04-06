import React, { createContext, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface WebSocketContextType {
  subscribe: (callback: (event: any) => void) => () => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const ws = React.useRef<WebSocket | null>(null);
  const subscribers = React.useRef<((event: any) => void)[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const reconnectTimeout = React.useRef<NodeJS.Timeout | undefined>(undefined);

  const connect = React.useCallback(() => {
    if (!token) return;
    
    try {
      ws.current = new WebSocket(`ws://localhost:3030/ws`, token);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);
          subscribers.current.forEach(cb => cb(data));
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.current?.close();
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      // Attempt to reconnect after 3 seconds
      reconnectTimeout.current = setTimeout(connect, 3000);
    }
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const subscribe = (callback: (event: any) => void) => {
    subscribers.current.push(callback);
    // Return unsubscribe function
    return () => {
      subscribers.current = subscribers.current.filter(cb => cb !== callback);
    };
  };

  return (
    <WebSocketContext.Provider value={{ subscribe, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error("useWebSocket must be used within WebSocketProvider");
  return context;
}; 