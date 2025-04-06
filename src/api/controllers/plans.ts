import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "@/api/middleware/auth";

const prisma = new PrismaClient();

export const getAllPlans = async (req: Request) => {
  const auth = await authMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        period: true,
        maxAccounts: true,
        maxMessages: true,
        features: true,
        createdAt: true,
        updatedAt: true,
        users: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    return new Response(JSON.stringify(plans), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error getting plans:", error);
    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }), 
      { status: 500 }
    );
  }
}; 