import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth";
import { hash } from "bcryptjs";
import { createAuditLog, AuditCategory, getRequestInfo } from "../../utils/audit-logger";


const prisma = new PrismaClient();

// Mendapatkan semua pengguna (hanya untuk admin)
export const getUsers = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    // Cek apakah user adalah admin
    const adminUser = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Akses ditolak" }), 
        { status: 403 }
      );
    }

    // Ambil semua user
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        planId: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return new Response(JSON.stringify(users), { status: 200 });
  } catch (error) {
    console.error("Error getting users:", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }), 
      { status: 500 }
    );
  }
};

// Mengubah paket pengguna
export const updateUserPlan = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    // Ekstrak ID pengguna dari URL
    const userId = req.url.split('/users/')[1].split('/plan')[0];
    
    // Cek apakah user adalah admin
    const adminUser = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Akses ditolak" }), 
        { status: 403 }
      );
    }

    // Dapatkan planId dari body
    const { planId } = await req.json();
    if (!planId) {
      return new Response(
        JSON.stringify({ error: "Paket harus dipilih" }), 
        { status: 400 }
      );
    }

    // Periksa apakah paket valid
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return new Response(
        JSON.stringify({ error: "Paket tidak ditemukan" }), 
        { status: 404 }
      );
    }

    // Update paket pengguna
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { planId }
    });

    return new Response(
      JSON.stringify({
        message: "Paket pengguna berhasil diperbarui",
        user: {
          id: updatedUser.id,
          planId: updatedUser.planId
        }
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user plan:", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }), 
      { status: 500 }
    );
  }
};

// Mengaktifkan/menonaktifkan pengguna
export const toggleUserStatus = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    // Ekstrak ID pengguna dari URL
    const userId = req.url.split('/users/')[1].split('/status')[0];
    
    // Cek apakah user adalah admin
    const adminUser = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Akses ditolak" }), 
        { status: 403 }
      );
    }

    // Dapatkan status dari body
    const { isActive } = await req.json();
    if (isActive === undefined) {
      return new Response(
        JSON.stringify({ error: "Status harus disertakan" }), 
        { status: 400 }
      );
    }

    // Update status pengguna
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    });

    return new Response(
      JSON.stringify({
        message: `Pengguna berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
        user: {
          id: updatedUser.id,
          isActive: updatedUser.isActive
        }
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error toggling user status:", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }), 
      { status: 500 }
    );
  }
};

// Membuat pengguna baru (admin only)
export const createUser = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    // Cek apakah user adalah admin
    const adminUser = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Akses ditolak" }), 
        { status: 403 }
      );
    }

    // Dapatkan data user dari body
    const { email, password, name, role = "user", planId = "starter" } = await req.json();
    
    // Validasi input
    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: "Email, password, dan nama harus diisi" }), 
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Email sudah terdaftar" }), 
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Buat user baru
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        planId,
        isActive: true
      }
    });

    return new Response(
      JSON.stringify({
        message: "Pengguna berhasil dibuat",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          planId: newUser.planId
        }
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }), 
      { status: 500 }
    );
  }
};

// Menghapus pengguna (admin only)
export const deleteUser = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    const userId = req.url.split('/users/')[1];
    
    // Cek apakah user adalah admin
    const adminUser = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Akses ditolak" }), 
        { status: 403 }
      );
    }

    // Periksa apakah pengguna yang akan dihapus ada
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!userToDelete) {
      console.log('Pengguna yang akan dihapus tidak ditemukan:', userId);
      return new Response(
        JSON.stringify({ error: "Pengguna tidak ditemukan" }), 
        { status: 404 }
      );
    }

    // Hapus semua data terkait dalam satu transaksi
    await prisma.$transaction(async (tx) => {
      // Hapus semua WhatsApp messages
      await tx.whatsAppMessage.deleteMany({
        where: { userId }
      });

      // Hapus semua API keys
      await tx.aPIKey.deleteMany({
        where: { userId }
      });

      // Hapus semua WhatsApp accounts
      await tx.whatsAppAccount.deleteMany({
        where: { userId }
      });

      // Hapus semua audit logs
      await tx.auditLog.deleteMany({
        where: { userId }
      });

      // Terakhir, hapus user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return new Response(
      JSON.stringify({
        message: "Pengguna berhasil dihapus"
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server", details: error instanceof Error ? error.message : String(error) }), 
      { status: 500 }
    );
  }
};

// === PLAN MANAGEMENT ===

// Mendapatkan semua paket
export const getPlans = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    // Cek apakah user adalah admin
    const adminUser = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Akses ditolak" }), 
        { status: 403 }
      );
    }

    // Ambil semua paket
    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: 'asc' }
    });

    return new Response(JSON.stringify(plans), { status: 200 });
  } catch (error) {
    console.error("Error getting plans:", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }), 
      { status: 500 }
    );
  }
};

// Membuat paket baru
export const createPlan = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    // Cek apakah user adalah admin
    const adminUser = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Akses ditolak" }), 
        { status: 403 }
      );
    }

    // Dapatkan data paket dari body
    const { id, name, price, period, maxAccounts, maxMessages, features } = await req.json();
    
    // Validasi input
    if (!id || !name || !price) {
      return new Response(
        JSON.stringify({ error: "ID, nama, dan harga paket harus diisi" }), 
        { status: 400 }
      );
    }

    // Cek apakah ID paket sudah ada
    const existingPlan = await prisma.plan.findUnique({ where: { id } });
    if (existingPlan) {
      return new Response(
        JSON.stringify({ error: "ID paket sudah digunakan" }), 
        { status: 400 }
      );
    }

    // Buat paket baru
    const newPlan = await prisma.plan.create({
      data: {
        id,
        name,
        price,
        period: period || "",
        maxAccounts: maxAccounts || 1,
        maxMessages: maxMessages || 1000,
        features: typeof features === 'string' ? features : JSON.stringify(features || [])
      }
    });

    // Tambahkan audit log
    const { ipAddress, userAgent } = getRequestInfo(req);
    await createAuditLog({
      userId: auth.userId,
      action: "CREATE_PLAN",
      category: AuditCategory.PLAN,
      description: `Admin created new plan: ${name}`,
      metadata: { planId: id, planDetails: { name, price, period, maxAccounts, maxMessages } },
      ipAddress,
      userAgent,
    });

    return new Response(
      JSON.stringify({
        message: "Paket berhasil dibuat",
        plan: newPlan
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating plan:", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }), 
      { status: 500 }
    );
  }
};

// Mengupdate paket
export const updatePlan = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    // Ekstrak ID paket dari URL
    const planId = req.url.split('/plans/')[1];
    
    // Cek apakah user adalah admin
    const adminUser = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Akses ditolak" }), 
        { status: 403 }
      );
    }

    // Dapatkan data paket dari body
    const { name, price, period, maxAccounts, maxMessages, features } = await req.json();
    
    // Cek apakah paket ada
    const existingPlan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!existingPlan) {
      return new Response(
        JSON.stringify({ error: "Paket tidak ditemukan" }), 
        { status: 404 }
      );
    }

    // Update paket
    const updatedPlan = await prisma.plan.update({
      where: { id: planId },
      data: {
        name: name !== undefined ? name : existingPlan.name,
        price: price !== undefined ? price : existingPlan.price,
        period: period !== undefined ? period : existingPlan.period,
        maxAccounts: maxAccounts !== undefined ? maxAccounts : existingPlan.maxAccounts,
        maxMessages: maxMessages !== undefined ? maxMessages : existingPlan.maxMessages,
        features: features !== undefined ? 
          (typeof features === 'string' ? features : JSON.stringify(features)) : 
          existingPlan.features
      }
    });

    return new Response(
      JSON.stringify({
        message: "Paket berhasil diperbarui",
        plan: updatedPlan
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating plan:", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }), 
      { status: 500 }
    );
  }
};

// Menghapus paket
export const deletePlan = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    // Ekstrak ID paket dari URL
    const planId = req.url.split('/plans/')[1];
    
    // Cek apakah user adalah admin
    const adminUser = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Akses ditolak" }), 
        { status: 403 }
      );
    }

    // Cek apakah paket masih digunakan oleh user
    const usersWithPlan = await prisma.user.count({
      where: { planId }
    });

    if (usersWithPlan > 0) {
      return new Response(
        JSON.stringify({ error: "Paket masih digunakan oleh pengguna, tidak dapat dihapus" }), 
        { status: 400 }
      );
    }

    // Menghapus paket
    await prisma.plan.delete({
      where: { id: planId }
    });

    return new Response(
      JSON.stringify({
        message: "Paket berhasil dihapus"
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting plan:", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }), 
      { status: 500 }
    );
  }
};

// Mendapatkan daftar audit log
export const getAuditLogs = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    // Cek apakah user adalah admin
    const adminUser = await prisma.user.findUnique({
      where: { id: auth.userId }
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: "Akses ditolak" }), 
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const category = url.searchParams.get('category');
    const userId = url.searchParams.get('userId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const search = url.searchParams.get('search');

    // Buat filter
    const where: any = {};
    if (category && category !== "ALL") where.category = category;
    if (userId) where.userId = userId;
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Tambahkan filter pencarian
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { action: { contains: search } },
        { ipAddress: { contains: search } },
        {
          user: {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } }
            ]
          }
        }
      ];
    }

    // Ambil data dengan pagination
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return new Response(
      JSON.stringify({
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting audit logs:", error);
    return new Response(
      JSON.stringify({ 
        error: "Terjadi kesalahan server",
        details: error instanceof Error ? error.message : "Unknown error"
      }), 
      { status: 500 }
    );
  }
};

export const getPlan = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  const planId = req.url.split('/plans/')[1];
  const plan = await prisma.plan.findUnique({
    where: { id: planId }
  });

  return new Response(JSON.stringify(plan), { status: 200 });
};

