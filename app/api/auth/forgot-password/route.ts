import { randomBytes, createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import {
  createRateLimiter,
  getRequestIdentifier,
  isValidEmailFormat,
  normalizeEmail,
} from "@/lib/security";
import { sendPasswordResetEmail } from "@/lib/email";

const forgotLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60_000,
});

export async function POST(req: NextRequest) {
  try {
    const clientId = getRequestIdentifier(req);
    const limit = forgotLimiter(clientId);

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSeconds),
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const { email } = await req.json();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !isValidEmailFormat(normalizedEmail)) {
      return NextResponse.json(
        {
          success: true,
          message: "If that email exists, reset instructions were generated.",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: "If that email exists, reset instructions were generated.",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail({
      to: normalizedEmail,
      resetUrl,
    });

    return NextResponse.json(
      {
        success: true,
        message: "If that email exists, reset instructions were sent.",
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
