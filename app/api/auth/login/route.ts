import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/lib/jwt";
import {
  createRateLimiter,
  getRequestIdentifier,
  isValidEmailFormat,
  normalizeEmail,
} from "@/lib/security";

const loginLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
});

export async function POST(req: NextRequest) {
  try {
    const clientId = getRequestIdentifier(req);
    const limit = loginLimiter(clientId);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSeconds),
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const { email, password } = await req.json();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = String(password || "");

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (
      !isValidEmailFormat(normalizedEmail) ||
      normalizedPassword.length > 128
    ) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const isPasswordValid = await bcrypt.compare(
      normalizedPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (user.role === "swimmer" && !user.isApproved) {
      return NextResponse.json(
        {
          error:
            "Your account is pending approval. Please contact an admin or coach.",
        },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isApproved: Boolean(user.isApproved),
        name: user.profile.callingName || user.profile.fullName,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
