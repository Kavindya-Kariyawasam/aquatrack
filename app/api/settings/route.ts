import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/jwt";
import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";

const SCHEDULE_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type ScheduleValue = "swimming" | "land" | "none";

function isValidScheduleValue(value: unknown): value is ScheduleValue {
  return value === "swimming" || value === "land" || value === "none";
}

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    let settings = await Settings.findOne().sort({ updatedAt: -1 }).lean();

    if (!settings) {
      settings = await Settings.create({
        statsPageVisible: true,
        overallStatsVisible: false,
        weeklySchedule: {
          monday: "swimming",
          tuesday: "swimming",
          wednesday: "none",
          thursday: "none",
          friday: "swimming",
          saturday: "land",
          sunday: "none",
        },
        holidays: [],
        updatedBy: authUser.userId,
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin only" },
        { status: 403 },
      );
    }

    const body = await req.json();

    const updates: Record<string, unknown> = {
      updatedBy: authUser.userId,
    };

    if ("statsPageVisible" in body) {
      updates.statsPageVisible = Boolean(body.statsPageVisible);
    }

    if ("overallStatsVisible" in body) {
      updates.overallStatsVisible = Boolean(body.overallStatsVisible);
    }

    if (body.weeklySchedule && typeof body.weeklySchedule === "object") {
      const scheduleCandidate = body.weeklySchedule as Record<string, unknown>;
      const normalizedSchedule: Record<string, ScheduleValue> = {};

      for (const key of SCHEDULE_KEYS) {
        const value = scheduleCandidate[key];
        if (!isValidScheduleValue(value)) {
          return NextResponse.json(
            { error: `Invalid schedule value for ${key}` },
            { status: 400 },
          );
        }

        normalizedSchedule[key] = value;
      }

      updates.weeklySchedule = normalizedSchedule;
    }

    if (Array.isArray(body.holidays)) {
      const normalizedHolidays = body.holidays
        .map(
          (item: { date?: string; sessionType?: unknown; reason?: string }) => {
            const date = new Date(item?.date || "");
            const sessionType = item?.sessionType;
            const reason = String(item?.reason || "")
              .trim()
              .slice(0, 120);

            if (
              Number.isNaN(date.getTime()) ||
              !isValidScheduleValue(sessionType)
            ) {
              return null;
            }

            return {
              date,
              sessionType,
              reason,
            };
          },
        )
        .filter(
          (
            item: {
              date: Date;
              sessionType: ScheduleValue;
              reason: string;
            } | null,
          ): item is {
            date: Date;
            sessionType: ScheduleValue;
            reason: string;
          } => Boolean(item),
        );

      updates.holidays = normalizedHolidays;
    }

    await dbConnect();

    const latest = await Settings.findOne().sort({ updatedAt: -1 }).lean();

    const settings = latest
      ? await Settings.findByIdAndUpdate(
          latest._id,
          {
            $set: updates,
          },
          { new: true },
        ).lean()
      : await Settings.create({
          statsPageVisible: true,
          overallStatsVisible: false,
          weeklySchedule: {
            monday: "swimming",
            tuesday: "swimming",
            wednesday: "none",
            thursday: "none",
            friday: "swimming",
            saturday: "land",
            sunday: "none",
          },
          holidays: [],
          ...updates,
        });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
