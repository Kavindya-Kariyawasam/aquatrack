import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/jwt";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";
import Timing from "@/models/Timing";
import User from "@/models/User";

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

    await dbConnect();

    const isManager = authUser.role === "admin" || authUser.role === "coach";

    if (!isManager) {
      const settings = await Settings.findOne()
        .sort({ updatedAt: -1 })
        .select("overallStatsVisible")
        .lean();
      if (!settings?.overallStatsVisible) {
        return NextResponse.json(
          { error: "Overall team stats are currently hidden" },
          { status: 403 },
        );
      }
    }

    const swimmers = await User.find({ role: "swimmer", isApproved: true })
      .select("email profile")
      .lean();

    const swimmerIds = swimmers.map((swimmer) => String(swimmer._id));
    const timings = await Timing.find({ userId: { $in: swimmerIds } }).lean();

    const swimmerMeta = new Map<
      string,
      { name: string; email: string; gender: string }
    >();

    const bySwimmer = swimmers.map((swimmer) => {
      const swimmerId = String(swimmer._id);
      const swimmerTimings = timings.filter(
        (timing) => timing.userId === swimmerId,
      );
      const bestByEvent: Record<string, string> = {};

      for (const timing of swimmerTimings) {
        const currentBest = bestByEvent[timing.event];
        if (!currentBest || toSeconds(timing.time) < toSeconds(currentBest)) {
          bestByEvent[timing.event] = timing.time;
        }
      }

      const profile = swimmer.profile as {
        callingName?: string;
        fullName?: string;
        gender?: string;
      };

      const name = profile?.callingName || profile?.fullName || swimmer.email;
      const gender = profile?.gender || "";

      swimmerMeta.set(swimmerId, { name, email: swimmer.email, gender });

      return {
        userId: swimmerId,
        name,
        email: swimmer.email,
        gender,
        totalTimings: swimmerTimings.length,
        eventsTracked: Object.keys(bestByEvent).length,
        bestByEvent,
      };
    });

    const leaderboardByEvent: Record<
      string,
      Array<{ userId: string; name: string; gender: string; time: string }>
    > = {};

    const leaderboardByEventGender: Record<
      string,
      {
        men: Array<{
          userId: string;
          name: string;
          gender: string;
          time: string;
        }>;
        women: Array<{
          userId: string;
          name: string;
          gender: string;
          time: string;
        }>;
      }
    > = {};

    for (const timing of timings) {
      const meta = swimmerMeta.get(timing.userId);
      if (!meta) continue;

      if (!leaderboardByEvent[timing.event]) {
        leaderboardByEvent[timing.event] = [];
      }

      leaderboardByEvent[timing.event].push({
        userId: timing.userId,
        name: meta.name,
        gender: meta.gender,
        time: timing.time,
      });
    }

    for (const eventName of Object.keys(leaderboardByEvent)) {
      const sorted = leaderboardByEvent[eventName].sort(
        (a, b) => toSeconds(a.time) - toSeconds(b.time),
      );

      leaderboardByEvent[eventName] = sorted.slice(0, 3);

      leaderboardByEventGender[eventName] = {
        men: sorted
          .filter((row) =>
            ["male", "m", "men"].includes(
              String(row.gender || "")
                .trim()
                .toLowerCase(),
            ),
          )
          .slice(0, 3),
        women: sorted
          .filter((row) =>
            ["female", "f", "women"].includes(
              String(row.gender || "")
                .trim()
                .toLowerCase(),
            ),
          )
          .slice(0, 3),
      };
    }

    return NextResponse.json({
      success: true,
      overall: {
        swimmerCount: swimmers.length,
        timingCount: timings.length,
        bySwimmer,
        leaderboardByEvent,
        leaderboardByEventGender,
      },
    });
  } catch (error) {
    console.error("Overall stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
