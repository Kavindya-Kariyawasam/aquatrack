import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/jwt";
import dbConnect from "@/lib/mongodb";
import { LEAVE_TYPES } from "@/lib/constants";
import Attendance from "@/models/Attendance";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");
    const statusFilter = String(searchParams.get("status") || "").trim();
    const monthFilter = String(searchParams.get("month") || "").trim();
    const canViewAll = authUser.role === "admin" || authUser.role === "coach";

    await dbConnect();

    const query: Record<string, unknown> = canViewAll
      ? requestedUserId
        ? { userId: requestedUserId }
        : {}
      : { userId: authUser.userId };

    if (statusFilter) {
      query.status = statusFilter;
    }

    if (/^\d{4}-\d{2}$/.test(monthFilter)) {
      const [yearText, monthText] = monthFilter.split("-");
      const year = Number(yearText);
      const monthIndex = Number(monthText) - 1;
      const startDate = new Date(Date.UTC(year, monthIndex, 1));
      const endDate = new Date(Date.UTC(year, monthIndex + 1, 1));

      query.date = { $gte: startDate, $lt: endDate };
    }

    const records = await Attendance.find(query).sort({ date: -1 }).lean();

    if (!canViewAll) {
      return NextResponse.json({ success: true, records });
    }

    const userIds = Array.from(new Set(records.map((record) => record.userId)));
    const users = await User.find({ _id: { $in: userIds } })
      .select("profile email")
      .lean();

    const userLookup = new Map(
      users.map((user) => {
        const profile = user.profile as {
          callingName?: string;
          fullName?: string;
        };
        const displayName =
          profile?.callingName || profile?.fullName || user.email;
        return [String(user._id), displayName];
      }),
    );

    const recordsWithNames = records.map((record) => ({
      ...record,
      userName: userLookup.get(record.userId) || record.userId,
    }));

    return NextResponse.json({ success: true, records: recordsWithNames });
  } catch (error) {
    console.error("Attendance GET error:", error);
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

    if (authUser.role !== "admin" && authUser.role !== "coach") {
      return NextResponse.json(
        { error: "Forbidden - Coach or Admin only" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const userId = String(body.userId || "").trim();
    const date = body.date ? new Date(body.date) : null;
    const type = String(body.type || "")
      .trim()
      .toLowerCase();
    const status = String(body.status || "").trim();
    const leaveType = String(body.leaveType || "").trim();
    const reason = String(body.reason || "").trim();

    if (!userId || !date || Number.isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Valid userId and date are required" },
        { status: 400 },
      );
    }

    if (type !== "swimming" && type !== "land") {
      return NextResponse.json(
        { error: "Invalid attendance type" },
        { status: 400 },
      );
    }

    if (
      !["present", "absent-unrequested", "absent-approved"].includes(status)
    ) {
      return NextResponse.json(
        {
          error:
            "Status must be present, absent-approved, or absent-unrequested",
        },
        { status: 400 },
      );
    }

    if (
      status === "absent-approved" &&
      !Object.prototype.hasOwnProperty.call(LEAVE_TYPES, leaveType)
    ) {
      return NextResponse.json(
        { error: "Leave type is required for approved leave" },
        { status: 400 },
      );
    }

    await dbConnect();

    const updateDoc: Record<string, Record<string, unknown>> = {
      $set: { status },
    };

    if (status === "absent-approved") {
      updateDoc.$set.leaveType = leaveType;
      updateDoc.$set.reason = reason.slice(0, 200);
    } else {
      updateDoc.$unset = { leaveType: "", reason: "" };
    }

    const record = await Attendance.findOneAndUpdate(
      { userId, date, type },
      updateDoc,
      { upsert: true, new: true },
    ).lean();

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Attendance POST error:", error);
    return NextResponse.json(
      { error: "Failed to update attendance" },
      { status: 500 },
    );
  }
}
