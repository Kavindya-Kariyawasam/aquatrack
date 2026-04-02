import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

if (JWT_SECRET.length < 32) {
  console.warn("JWT_SECRET should be at least 32 characters long");
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: "swimmer" | "coach" | "admin";
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  if (JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d", // 7 days
  });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

// Extract token from request
export function getTokenFromRequest(req: NextRequest): string | null {
  // Try to get token from cookie
  const token = req.cookies.get("token")?.value;

  if (token) {
    return token;
  }

  // Try to get token from Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

// Get user from request
export function getUserFromRequest(req: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(req);

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

// Check if user has required role
export function hasRole(user: JWTPayload | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
