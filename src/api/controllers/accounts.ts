import { checkPlanLimits } from "@/utils/planLimits";
import { getUser } from "@/api/controllers/users";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "@/api/middleware/auth";

const prisma = new PrismaClient();

export async function addWhatsAppAccount(req: Request) {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: {
      whatsAppAccounts: true,
      plan: true
    }
  });
  
  const limits = checkPlanLimits({
    planId: user.planId,
    currentAccounts: user.whatsAppAccounts.length,
    currentMessages: user.messagesSentThisMonth
  });

  if (!limits.canAddAccount) {
    return new Response(
      JSON.stringify({ 
        error: "Batas maksimum akun WhatsApp telah tercapai. Silakan upgrade paket Anda.",
        currentAccounts: user.whatsAppAccounts.length,
        maxAccounts: user.plan.maxAccounts
      }),
      { status: 403 }
    );
  }

  // Lanjutkan proses penambahan akun
  // ... kode penambahan akun ...
} 