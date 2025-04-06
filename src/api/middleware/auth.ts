import { verify } from "jsonwebtoken";

export interface JWTPayload {
  userId: string;
  email: string;
}

export const authMiddleware = async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
    });
  }
}; 