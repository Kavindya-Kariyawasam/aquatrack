import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/jwt";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(authUser.userId)
      .select("email role isApproved profile")
      .lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = user.profile as { fullName?: string; callingName?: string };

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        role: user.role,
        isApproved: Boolean(user.isApproved),
        name: profile?.callingName || profile?.fullName || "Swimmer",
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
