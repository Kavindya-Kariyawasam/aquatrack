import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { isStrongPassword, sanitizeText } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    const rawToken = sanitizeText(token, 256);
    const nextPassword = String(password || "");

    if (!rawToken || !isStrongPassword(nextPassword)) {
      return NextResponse.json(
        {
          error: "Token and a strong password are required",
        },
        { status: 400 },
      );
    }

    const hashedToken = createHash("sha256").update(rawToken).digest("hex");

    await dbConnect();

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    user.password = await bcrypt.hash(nextPassword, 12);
    user.resetPasswordToken = "";
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successful. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
