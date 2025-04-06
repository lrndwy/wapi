import { checkPlanLimits } from '@/utils/planLimits';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkWebhookAccess(req: Request) {
  const apiKey = req.headers.get("X-API-Key");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key diperlukan" }), 
      { status: 401 }
    );
  }

  const key = await prisma.aPIKey.findUnique({
    where: { key: apiKey },
    include: {
      whatsappAccount: {
        include: {
          user: true
        }
      }
    }
  });

  if (!key || !key.isActive) {
    return new Response(
      JSON.stringify({ error: "API key tidak valid" }), 
      { status: 401 }
    );
  }

  const user = key.whatsappAccount.user;
  const limits = checkPlanLimits({
    planId: user.planId,
    currentAccounts: 0, // tidak relevan untuk webhook
    currentMessages: 0  // tidak relevan untuk webhook
  });

  if (!limits.hasWebhookAccess) {
    return new Response(
      JSON.stringify({ 
        error: "Fitur webhook hanya tersedia untuk paket Professional dan Enterprise" 
      }), 
      { status: 403 }
    );
  }

  return null; // akses diberikan
} 