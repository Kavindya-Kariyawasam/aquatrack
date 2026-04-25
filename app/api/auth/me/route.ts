import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/jwt";
import User from "@/models/User";

const AUTH_ME_CACHE_TTL_MS = 60_000;

type CachedAuthMe = {
  expiresAt: number;
  payload: {
    success: boolean;
    user: {
      email: string;
      role: string;
      isApproved: boolean;
      name: string;
      gender: string;
      mainEvents: string[];
      extraEvents: string[];
    };
  };
};

declare global {
  var authMeCache: Map<string, CachedAuthMe> | undefined;
}

const authMeCache = global.authMeCache || new Map<string, CachedAuthMe>();
if (!global.authMeCache) {
  global.authMeCache = authMeCache;
}

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cached = authMeCache.get(authUser.userId);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.payload);
    }

    await dbConnect();

    const user = await User.findById(authUser.userId)
      .select("email role isApproved profile")
      .lean();
    if (!user) {
      authMeCache.delete(authUser.userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = user.profile as {
      fullName?: string;
      callingName?: string;
      gender?: "male" | "female" | "";
      mainEvents?: string[];
      extraEvents?: string[];
    };

    const payload = {
      success: true,
      user: {
        email: user.email,
        role: user.role,
        isApproved: Boolean(user.isApproved),
        name: profile?.callingName || profile?.fullName || "Swimmer",
        gender: profile?.gender || "",
        mainEvents: profile?.mainEvents || [],
        extraEvents: profile?.extraEvents || [],
      },
    };

    authMeCache.set(authUser.userId, {
      expiresAt: Date.now() + AUTH_ME_CACHE_TTL_MS,
      payload,
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
