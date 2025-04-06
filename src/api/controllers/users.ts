import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "@/api/middleware/auth";
import { checkPlanLimits } from "@/utils/planLimits";
import { compare, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
const prismaClient = new PrismaClient();

export const updateProfile = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    const { name, email } = await req.json();

    // Validasi input
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Nama dan email harus diisi" }), 
        { status: 400 }
      );
    }

    // Cek apakah email sudah digunakan (kecuali oleh user yang sama)
    const existingUser = await prismaClient.user.findFirst({
      where: {
        email,
        NOT: {
          id: auth.userId
        }
      }
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Email sudah digunakan" }), 
        { status: 400 }
      );
    }

    // Update profil user
    const updatedUser = await prismaClient.user.update({
      where: {
        id: auth.userId
      },
      data: {
        name,
        email
      }
    });

    return new Response(
      JSON.stringify({
        message: "Profil berhasil diperbarui",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name
        }
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }), 
      { status: 500 }
    );
  }
};

export async function getUser(req: Request) {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  const user = await prismaClient.user.findUnique({
    where: { id: auth.userId },
    include: {
      whatsAppAccounts: true,
      plan: true
    }
  });

  return new Response(JSON.stringify(user), { status: 200 });
}

export const updateUser = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    const { name, email, role, isActive } = await req.json();
    const userId = req.url.split('/users/')[1];

    const updatedUser = await prismaClient.user.update({
      where: { id: userId },
      data: { name, email, role, isActive }
    });

    return new Response(JSON.stringify(updatedUser), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Gagal memperbarui user" }), 
      { status: 500 }
    );
  }
};

export async function getUserProfile(req: Request) {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  const user = await prismaClient.user.findUnique({
    where: { id: auth.userId },
    include: {
      plan: true,
      whatsAppAccounts: true,
      messages: {
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(1)) // Pesan bulan ini
          }
        }
      }
    }
  });

  if (!user) {
    return new Response(
      JSON.stringify({ error: "User tidak ditemukan" }), 
      { status: 404 }
    );
  }

  // Dapatkan informasi batasan
  const limits = checkPlanLimits({
    planId: user.planId,
    currentAccounts: user.whatsAppAccounts.length,
    currentMessages: user.messages.length
  });

  return new Response(
    JSON.stringify({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: {
          id: user.plan.id,
          name: user.plan.name,
          price: user.plan.price,
          period: user.plan.period,
          maxAccounts: user.plan.maxAccounts,
          maxMessages: user.plan.maxMessages,
          features: user.plan.features
        },
        usage: {
          whatsappAccounts: {
            current: user.whatsAppAccounts.length,
            max: user.plan.maxAccounts
          },
          messages: {
            current: user.messages.length,
            max: user.plan.maxMessages
          }
        },
        features: {
          canAddMoreAccounts: limits.canAddAccount,
          canSendMessages: limits.canSendMessage,
          hasWebhookAccess: limits.hasWebhookAccess,
          hasAdvancedApi: limits.hasAdvancedApi
        }
      }
    }),
    { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

export const updatePassword = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    // Log untuk debugging
    console.log('Request body:', body);

    // Validasi input
    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ 
          error: "Password lama dan baru harus diisi",
          received: { currentPassword: !!currentPassword, newPassword: !!newPassword }
        }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Ambil user dari database
    const user = await prismaClient.user.findUnique({
      where: { id: auth.userId }
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Pengguna tidak ditemukan" }), 
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Verifikasi password lama
    const isPasswordValid = await compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ error: "Password lama tidak sesuai" }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Hash password baru
    const hashedPassword = await hash(newPassword, 10);

    // Update password
    await prismaClient.user.update({
      where: { id: auth.userId },
      data: { password: hashedPassword }
    });

    return new Response(
      JSON.stringify({ 
        message: "Password berhasil diperbarui",
        success: true 
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error("Error updating password:", error);
    return new Response(
      JSON.stringify({ 
        error: "Terjadi kesalahan server",
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};