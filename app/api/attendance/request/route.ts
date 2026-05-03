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

    const rawDates: unknown[] = Array.isArray(body.dates)
      ? body.dates
      : body.date
        ? [body.date]
        : [];
    const providedType = String(body.type || "")
      .trim()
      .toLowerCase();
    const leaveType = String(body.leaveType || "").trim();
    const reason = String(body.reason || "").trim();

    const normalizedDates = Array.from(
      new Set(
        rawDates
          .map((value: unknown) => String(value || "").trim())
          .filter((value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)),
      ),
    );

    if (normalizedDates.length === 0) {
      return NextResponse.json(
        { error: "At least one valid date is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const settings = await Settings.findOne().lean();

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

    const holidays = (settings?.holidays || []) as Array<{
      date: Date | string;
    }>;
    const holidayKeys = new Set(
      holidays.map((holiday) =>
        new Date(holiday.date).toISOString().slice(0, 10),
      ),
    );

    const records: unknown[] = [];
    const failedDates: Array<{ date: string; error: string }> = [];

    for (const dateText of normalizedDates) {
      const date = new Date(dateText);
      if (Number.isNaN(date.getTime())) {
        failedDates.push({ date: dateText, error: "Invalid date" });
        continue;
      }

      const dayKey = date.toISOString().slice(0, 10);
      if (holidayKeys.has(dayKey)) {
        failedDates.push({
          date: dateText,
          error: "Cannot request leave on a holiday/no-practice day",
        });
        continue;
      }

      let resolvedType = providedType;
      if (resolvedType !== "swimming" && resolvedType !== "land") {
        const weekdayKey = WEEKDAY_KEYS[date.getDay()];
        const inferredType = settings?.weeklySchedule?.[weekdayKey];

        if (inferredType === "swimming" || inferredType === "land") {
          resolvedType = inferredType;
        } else {
          failedDates.push({
            date: dateText,
            error: "No scheduled practice session on selected date",
          });
          continue;
        }
      }

      const record = await Attendance.findOneAndUpdate(
        { userId: authUser.userId, date, type: resolvedType },
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

      records.push(record);
    }

    if (records.length === 0) {
      return NextResponse.json(
        {
          error: failedDates[0]?.error || "Failed to submit leave request",
          failedDates,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      records,
      submittedCount: records.length,
      failedCount: failedDates.length,
      failedDates,
    });
  } catch (error) {
    console.error("Attendance request POST error:", error);
    return NextResponse.json(
      { error: "Failed to submit leave request" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const attendanceId = String(body.attendanceId || "").trim();

    if (!attendanceId) {
      return NextResponse.json(
        { error: "attendanceId is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const record = await Attendance.findById(attendanceId).lean();
    if (!record) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 },
      );
    }

    const canManageAll = authUser.role === "admin" || authUser.role === "coach";
    const isOwner = record.userId === authUser.userId;

    if (!canManageAll && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (record.status !== "absent-requested") {
      return NextResponse.json(
        {
          error:
            "This request has already been processed by admins and cannot be deleted",
        },
        { status: 409 },
      );
    }

    await Attendance.findByIdAndDelete(attendanceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Attendance request DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete leave request" },
      { status: 500 },
    );
  }
}
