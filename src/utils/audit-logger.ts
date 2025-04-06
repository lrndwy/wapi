import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export enum AuditCategory {
  AUTH = "AUTH",
  USER = "USER",
  WHATSAPP = "WHATSAPP",
  PLAN = "PLAN",
  API = "API",
}

export interface AuditLogData {
  userId: string;
  action: string;
  category: AuditCategory;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        category: data.category,
        description: data.description,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error("Error creating audit log:", error);
  }
}

// Helper untuk mendapatkan informasi request
export function getRequestInfo(req: Request) {
  return {
    ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    userAgent: req.headers.get("user-agent") || "unknown",
  };
} 