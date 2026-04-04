import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/jwt";
import dbConnect from "@/lib/mongodb";
import Attendance from "@/models/Attendance";

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
    const attendanceId = String(body.attendanceId || "").trim();
    const approve = body.approve !== false;

    if (!attendanceId) {
      return NextResponse.json(
        { error: "attendanceId is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const updated = await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        $set: {
          status: approve ? "absent-approved" : "absent-unrequested",
          approvedBy: authUser.userId,
          approvedAt: new Date(),
        },
      },
      { new: true },
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Attendance request not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, record: updated });
  } catch (error) {
    console.error("Attendance approve error:", error);
    return NextResponse.json(
      { error: "Failed to approve request" },
      { status: 500 },
    );
  }
}
