import { checkPlanLimits } from '@/utils/planLimits';
import { getUser } from '@/api/controllers/users';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/api/middleware/auth';

const prisma = new PrismaClient();

export async function sendMessage(req: Request) {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: {
      whatsAppAccounts: true,
      plan: true
    }
  });
  
  // Hitung pesan bulan ini
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const messageCount = await prisma.whatsAppMessage.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: startOfMonth
      }
    }
  });

  const limits = checkPlanLimits({
    planId: user.planId,
    currentAccounts: user.whatsAppAccounts.length,
    currentMessages: messageCount
  });

  if (!limits.canSendMessage) {
    return new Response(
      JSON.stringify({ 
        error: "Batas pengiriman pesan bulanan telah tercapai. Silakan upgrade paket Anda.",
        currentMessages: messageCount,
        maxMessages: user.plan.maxMessages
      }),
      { status: 403 }
    );
  }

  // Lanjutkan proses pengiriman pesan
  // ... kode pengiriman pesan ...
} 