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

    const updateDoc: any = {
      $set: {
        status: approve ? "absent-approved" : "absent-unrequested",
        approvedBy: authUser.userId,
        approvedAt: new Date(),
      },
    };

    // optional leaveType and reason when approving
    const leaveType = body.leaveType
      ? String(body.leaveType).trim()
      : undefined;
    const reason = body.reason
      ? String(body.reason).trim().slice(0, 200)
      : undefined;

    if (approve) {
      if (leaveType) updateDoc.$set.leaveType = leaveType;
      if (reason) updateDoc.$set.reason = reason;
    } else {
      updateDoc.$unset = { leaveType: "", reason: "" };
    }

    const updated = await Attendance.findByIdAndUpdate(
      attendanceId,
      updateDoc,
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
