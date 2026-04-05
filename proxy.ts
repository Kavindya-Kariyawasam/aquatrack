import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];
const adminRoutes = ["/admin", "/api/settings", "/api/export"];
const coachOrAdminRoutes = ["/api/users", "/team", "/api/attendance/approve"];
const selfAllowedRoutes = ["/api/users/profile"];

type ProxyUser = {
  userId: string;
  email: string;
  role: "swimmer" | "coach" | "admin";
};

async function verifyEdgeToken(token: string): Promise<ProxyUser | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );

    const role = payload.role;
    if (role !== "swimmer" && role !== "coach" && role !== "admin") {
      return null;
    }

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role,
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    if (!pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await verifyEdgeToken(token);

  if (!user) {
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Invalid token" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));

    response.cookies.delete("token");
    return response;
  }

  if (
    adminRoutes.some((route) => pathname.startsWith(route)) &&
    user.role !== "admin"
  ) {
    return pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
      : NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (selfAllowedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (
    coachOrAdminRoutes.some((route) => pathname.startsWith(route)) &&
    user.role !== "coach" &&
    user.role !== "admin"
  ) {
    return pathname.startsWith("/api/")
      ? NextResponse.json(
          { error: "Forbidden - Coach or Admin only" },
          { status: 403 },
        )
      : NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
