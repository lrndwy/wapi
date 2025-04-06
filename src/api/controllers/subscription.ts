import { authMiddleware } from "@/api/middleware/auth";
import { PrismaClient } from "@prisma/client";
import { createAuditLog, AuditCategory } from "@/utils/audit-logger";
import { checkPlanLimits } from "@/utils/planLimits";

const prismaClient = new PrismaClient();

export const changePlan = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    const { newPlanId } = await req.json();
    
    // Dapatkan user dan rencana saat ini
    const user = await prismaClient.user.findUnique({
      where: { id: auth.userId },
      include: {
        whatsAppAccounts: true,
        plan: true
      }
    });

    // Dapatkan rencana baru
    const newPlan = await prismaClient.plan.findUnique({
      where: { id: newPlanId }
    });

    if (!newPlan) {
      return new Response(
        JSON.stringify({ error: "Paket tidak ditemukan" }), 
        { status: 404 }
      );
    }

    // Validasi downgrade
    if (user.whatsAppAccounts.length > newPlan.maxAccounts) {
      return new Response(
        JSON.stringify({ 
          error: "Tidak dapat downgrade. Jumlah akun WhatsApp melebihi batas paket baru." 
        }), 
        { status: 400 }
      );
    }

    // Update plan
    await prismaClient.user.update({
      where: { id: auth.userId },
      data: { planId: newPlanId }
    });

    // Catat di audit log
    await createAuditLog({
      userId: auth.userId,
      action: "CHANGE_PLAN",
      category: AuditCategory.PLAN,
      description: `User changed plan from ${user.plan.name} to ${newPlan.name}`,
      metadata: {
        oldPlan: user.plan.id,
        newPlan: newPlanId
      }
    });

    return new Response(
      JSON.stringify({
        message: "Paket berhasil diubah",
        plan: newPlan
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error changing plan:", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }), 
      { status: 500 }
    );
  }
};

export const getCurrentSubscription = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  const user = await prismaClient.user.findUnique({
    where: { id: auth.userId },
    include: { 
      plan: true,
      whatsAppAccounts: true,
      messages: {
        where: {
          createdAt: { gte: new Date(new Date().setDate(1)) } // Pesan bulan ini
        }
      }
    }
  });

  if (!user || !user.plan) {
    return new Response(
      JSON.stringify({ error: "User atau plan tidak ditemukan" }), 
      { status: 404 }
    );
  }

  // Dapatkan informasi batasan dan fitur
  const limits = checkPlanLimits({
    planId: user.planId,
    currentAccounts: user.whatsAppAccounts.length,
    currentMessages: user.messages.length
  });

  return new Response(
    JSON.stringify({ 
      subscription: {
        ...user.plan,
        features: {
          canAddMoreAccounts: limits.canAddAccount,
          canSendMessages: limits.canSendMessage,
          hasWebhookAccess: limits.hasWebhookAccess,
          hasAdvancedApi: limits.hasAdvancedApi
        }
      }
    }), 
    { status: 200 }
  );
};

export const getUsageStats = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const [user, messageCount] = await Promise.all([
    prismaClient.user.findUnique({
      where: { id: auth.userId },
      include: { 
        plan: true,
        whatsAppAccounts: true 
      }
    }),
    prismaClient.whatsAppMessage.count({
      where: {
        userId: auth.userId,
        createdAt: { gte: startOfMonth }
      }
    })
  ]);

  return new Response(JSON.stringify({
    accounts: {
      used: user.whatsAppAccounts.length,
      total: user.plan.maxAccounts
    },
    messages: {
      used: messageCount,
      total: user.plan.maxMessages
    }
  }), { status: 200 });
}; 