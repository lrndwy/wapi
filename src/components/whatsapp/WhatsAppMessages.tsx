import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { Check, CheckCheck } from "lucide-react";

interface Message {
  from: string;
  body: string;
  timestamp: number;
  id: string;
  status: "SENT" | "RECEIVED" | "READ";
}

interface WhatsAppMessagesProps {
  accountId: string;
}

export function WhatsAppMessages({ accountId }: WhatsAppMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const handleMessage = (event: any) => {
      if (event.type === "MESSAGE_RECEIVED" && event.whatsappId === accountId) {
        setMessages(prev => [{
          ...event.message,
          status: event.message.status || "RECEIVED"
        }, ...prev]);
      } else if (event.type === "MESSAGE_STATUS_UPDATE" && event.whatsappId === accountId) {
        setMessages(prev => prev.map(msg => 
          msg.id === event.messageId 
            ? { ...msg, status: event.status }
            : msg
        ));
      }
    };

    subscribe(handleMessage);

    return () => {
      // Cleanup subscription jika diperlukan
    };
  }, [accountId, subscribe]);

  const renderMessageStatus = (status: string) => {
    switch (status) {
      case "SENT":
        return <Check className="w-4 h-4 text-gray-400" />;
      case "RECEIVED":
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case "READ":
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pesan Masuk</CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Belum ada pesan masuk
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={message.id} className="border p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium">{message.from}</p>
                  <div className="flex items-center space-x-2">
                    {renderMessageStatus(message.status)}
                    <p className="text-sm text-muted-foreground">
                      {new Date(message.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm mb-2">{message.body}</p>
                <p className="text-xs text-muted-foreground break-all">
                  Message ID: {message.id}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 