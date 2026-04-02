import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import {
  createRateLimiter,
  getRequestIdentifier,
  isAllowedEmailDomain,
  isStrongPassword,
  isValidEmailFormat,
  normalizeEmail,
  sanitizeText,
} from "@/lib/security";

const registerLimiter = createRateLimiter({
  maxRequests: 8,
  windowMs: 60_000,
});

export async function POST(req: NextRequest) {
  try {
    const clientId = getRequestIdentifier(req);
    const limit = registerLimiter(clientId);

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSeconds),
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const { email, password, fullName } = await req.json();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = String(password || "");
    const normalizedFullName = sanitizeText(fullName, 80);

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (!isValidEmailFormat(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    if (!isAllowedEmailDomain(normalizedEmail)) {
      const domain = process.env.ALLOWED_EMAIL_DOMAIN;
      return NextResponse.json(
        {
          error: domain
            ? `Only ${domain} emails or approved exception emails are allowed`
            : "This email is not allowed",
        },
        { status: 400 },
      );
    }

    if (!isStrongPassword(normalizedPassword)) {
      return NextResponse.json(
        {
          error:
            "Password must be 8+ chars and include uppercase, lowercase, number, and symbol",
        },
        { status: 400 },
      );
    }

    await dbConnect();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 12);

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      role: "swimmer",
      isApproved: false,
      profile: {
        fullName: normalizedFullName || "",
        callingName: "",
        mainEvents: [],
        extraEvents: [],
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. Awaiting admin approval.",
        userId: user._id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
