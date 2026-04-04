import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/jwt";
import dbConnect from "@/lib/mongodb";
import Timing from "@/models/Timing";

function toSeconds(time: string): number {
  const parts = time.split(":");
  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1]);
  }
  return Number(time);
}

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    const userId =
      (authUser.role === "admin" || authUser.role === "coach") &&
      requestedUserId
        ? requestedUserId
        : authUser.userId;

    await dbConnect();

    const timings = await Timing.find({ userId }).sort({ date: 1 }).lean();

    const bestByEvent: Record<string, string> = {};

    for (const timing of timings) {
      const event = timing.event;
      const current = bestByEvent[event];

      if (!current || toSeconds(timing.time) < toSeconds(current)) {
        bestByEvent[event] = timing.time;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalTimings: timings.length,
        eventsTracked: Object.keys(bestByEvent).length,
        bestByEvent,
        latestFive: timings.slice(-5).reverse(),
      },
    });
  } catch (error) {
    console.error("Timings stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
