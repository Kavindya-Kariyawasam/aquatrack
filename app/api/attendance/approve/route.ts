import { NextRequest, NextResponse } from "next/server";
import { LEAVE_TYPES } from "@/lib/constants";
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
    const targetStatus = String(body.targetStatus || "").trim();

    if (!attendanceId) {
      return NextResponse.json(
        { error: "attendanceId is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const nextStatus =
      targetStatus || (approve ? "absent-approved" : "absent-unrequested");

    if (
      !["absent-requested", "absent-approved", "absent-unrequested"].includes(
        nextStatus,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid target status" },
        { status: 400 },
      );
    }

    const updateDoc: any = {
      $set: {
        status: nextStatus,
      },
    };

    if (nextStatus === "absent-approved") {
      updateDoc.$set.approvedBy = authUser.userId;
      updateDoc.$set.approvedAt = new Date();
    } else {
      updateDoc.$unset = {
        ...(updateDoc.$unset || {}),
        approvedBy: "",
        approvedAt: "",
      };
    }

    // optional leaveType and reason
    const leaveType = body.leaveType
      ? String(body.leaveType).trim()
      : undefined;
    const reason = body.reason
      ? String(body.reason).trim().slice(0, 200)
      : undefined;

    if (nextStatus === "absent-approved") {
      if (
        !leaveType ||
        !Object.prototype.hasOwnProperty.call(LEAVE_TYPES, leaveType)
      ) {
        return NextResponse.json(
          { error: "Valid leave type is required for approved leave" },
          { status: 400 },
        );
      }

      updateDoc.$set.leaveType = leaveType;
      if (reason) updateDoc.$set.reason = reason;
    } else {
      // keep requested details for pending/rejected leave logs
      if (leaveType) updateDoc.$set.leaveType = leaveType;
      if (reason) updateDoc.$set.reason = reason;
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
