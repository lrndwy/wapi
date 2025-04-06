import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { createAuditLog, AuditCategory, getRequestInfo } from "../../utils/audit-logger";

const prisma = new PrismaClient();

export const register = async (req: Request) => {
  try {
    const { email, password, name } = await req.json();

    // Tambahkan logging untuk debug
    console.log('Register attempt:', { email, name });

    // Validasi input yang lebih ketat
    if (!email?.trim() || !password?.trim() || !name?.trim()) {
      return new Response(
        JSON.stringify({ error: "Email, password, dan nama harus diisi" }), 
        { status: 400 }
      );
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Format email tidak valid" }), 
        { status: 400 }
      );
    }

    // Tambahkan try-catch khusus untuk operasi database
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return new Response(
          JSON.stringify({ error: "Email sudah terdaftar" }), 
          { status: 400 }
        );
      }
    } catch (dbError) {
      console.error('Database error during user check:', dbError);
      throw dbError;
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Buat user baru dengan planId default 'free'
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        planId: 'free',
        isActive: true
      },
    });

    // Generate token
    const token = sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return new Response(
      JSON.stringify({ 
        message: "Registrasi berhasil",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }),
      { status: 201 }
    );
  } catch (error) {
    // Perbaikan error handling
    console.error('Register error:', error);
    return new Response(
      JSON.stringify({ 
        error: "Terjadi kesalahan server",
        details: error instanceof Error ? error.message : String(error)
      }), 
      { status: 500 }
    );
  }
};

export const login = async (req: Request) => {
  try {
    const { email, password } = await req.json();

    // Validasi input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email dan password harus diisi" }), 
        { status: 400 }
      );
    }

    // Cari user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Email atau password salah" }), 
        { status: 401 }
      );
    }

    // Verifikasi password
    const validPassword = await compare(password, user.password);
    if (!validPassword) {
      return new Response(
        JSON.stringify({ error: "Email atau password salah" }), 
        { status: 401 }
      );
    }

    // Tambahkan audit log
    const { ipAddress, userAgent } = getRequestInfo(req);
    await createAuditLog({
      userId: user.id,
      action: "LOGIN",
      category: AuditCategory.AUTH,
      description: `User ${user.email} logged in`,
      ipAddress,
      userAgent,
    });

    // Generate token
    const token = sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return new Response(
      JSON.stringify({
        message: "Login berhasil",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }), 
      { status: 500 }
    );
  }
}; 