import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/jwt";
import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import User from "@/models/User";

function getMonthBounds(monthText: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const fallback = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const safeMonthText = /^\d{4}-\d{2}$/.test(monthText) ? monthText : fallback;
  const [yearText, monthNumberText] = safeMonthText.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthNumberText) - 1;

  return {
    startDate: new Date(Date.UTC(year, monthIndex, 1)),
    endDate: new Date(Date.UTC(year, monthIndex + 1, 1)),
  };
}

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const month = String(new URL(req.url).searchParams.get("month") || "");
    const { startDate, endDate } = getMonthBounds(month);

    await dbConnect();

    const canViewAll = authUser.role === "admin" || authUser.role === "coach";
    const query: Record<string, unknown> = {
      date: { $gte: startDate, $lt: endDate },
    };

    if (!canViewAll) {
      query.userId = authUser.userId;
    }

    const records = await Attendance.find(query).lean();

    if (!canViewAll) {
      const approved = records.filter(
        (record) => record.status === "absent-approved",
      ).length;
      const pending = records.filter(
        (record) => record.status === "absent-requested",
      ).length;
      const rejected = records.filter(
        (record) => record.status === "absent-unrequested",
      ).length;
      const byLeaveType: Record<string, number> = {};

      for (const record of records) {
        if (!record.leaveType || record.status !== "absent-approved") continue;
        byLeaveType[record.leaveType] =
          (byLeaveType[record.leaveType] || 0) + 1;
      }

      return NextResponse.json({
        success: true,
        summary: {
          approved,
          pending,
          rejected,
          byLeaveType,
          totalRecords: records.length,
        },
      });
    }

    const swimmerUsers = await User.find({ role: "swimmer", isApproved: true })
      .select("profile email")
      .lean();

    const statsByUser = new Map<
      string,
      {
        userId: string;
        userName: string;
        approved: number;
        pending: number;
        rejected: number;
        byLeaveType: Record<string, number>;
      }
    >();

    for (const swimmer of swimmerUsers) {
      const profile = swimmer.profile as {
        callingName?: string;
        fullName?: string;
      };
      statsByUser.set(String(swimmer._id), {
        userId: String(swimmer._id),
        userName: profile?.callingName || profile?.fullName || swimmer.email,
        approved: 0,
        pending: 0,
        rejected: 0,
        byLeaveType: {},
      });
    }

    for (const record of records) {
      const target = statsByUser.get(record.userId);
      if (!target) continue;

      if (record.status === "absent-approved") target.approved += 1;
      if (record.status === "absent-requested") target.pending += 1;
      if (record.status === "absent-unrequested") target.rejected += 1;

      if (record.leaveType && record.status === "absent-approved") {
        target.byLeaveType[record.leaveType] =
          (target.byLeaveType[record.leaveType] || 0) + 1;
      }
    }

    const summary = Array.from(statsByUser.values()).sort((a, b) =>
      a.userName.localeCompare(b.userName),
    );

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Attendance summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
