import type { ServerWebSocket } from "bun";
import { server } from "../../index.js";

interface WebSocketData {
  protocol?: string;
  userId?: string;
}

export const sendToUser = (userId: string, data: any) => {
  server.publish("user:" + userId, JSON.stringify(data));
}; 