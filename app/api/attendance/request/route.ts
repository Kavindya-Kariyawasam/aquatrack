import { NextRequest, NextResponse } from "next/server";
import { LEAVE_TYPES } from "@/lib/constants";
import { getUserFromRequest } from "@/lib/jwt";
import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Settings from "@/models/Settings";

const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const records = await Attendance.find({
      userId: authUser.userId,
      status: {
        $in: ["absent-requested", "absent-approved", "absent-unrequested"],
      },
    })
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error("Attendance request GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const date = body.date ? new Date(body.date) : null;
    const providedType = String(body.type || "")
      .trim()
      .toLowerCase();
    let type = providedType;
    const leaveType = String(body.leaveType || "").trim();
    const reason = String(body.reason || "").trim();

    if (!date || Number.isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Valid date is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const settings = await Settings.findOne().lean();

    if (settings?.holidays?.length) {
      const targetDay = new Date(date);
      targetDay.setHours(0, 0, 0, 0);

      const holidays = settings.holidays as Array<{ date: Date | string }>;

      const isHoliday = holidays.some((holiday) => {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate.getTime() === targetDay.getTime();
      });

      if (isHoliday) {
        return NextResponse.json(
          { error: "Cannot request leave on a holiday/no-practice day" },
          { status: 400 },
        );
      }
    }

    if (type !== "swimming" && type !== "land") {
      const weekdayKey = WEEKDAY_KEYS[date.getDay()];
      const inferredType = settings?.weeklySchedule?.[weekdayKey];

      if (inferredType === "swimming" || inferredType === "land") {
        type = inferredType;
      } else {
        return NextResponse.json(
          { error: "No scheduled practice session on selected date" },
          { status: 400 },
        );
      }
    }

    if (!(leaveType in LEAVE_TYPES)) {
      return NextResponse.json(
        { error: "Invalid leave type" },
        { status: 400 },
      );
    }

    if (leaveType === "other" && !reason) {
      return NextResponse.json(
        { error: "Reason is required for 'other' leave type" },
        { status: 400 },
      );
    }

    const record = await Attendance.findOneAndUpdate(
      { userId: authUser.userId, date, type },
      {
        $set: {
          status: "absent-requested",
          leaveType,
          reason,
          requestedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    ).lean();

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Attendance request POST error:", error);
    return NextResponse.json(
      { error: "Failed to submit leave request" },
      { status: 500 },
    );
  }
}
