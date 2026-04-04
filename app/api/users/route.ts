import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/jwt";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role !== "admin" && authUser.role !== "coach") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    const users = await User.find()
      .select("email role isApproved profile createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Users list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, isApproved, role } = await req.json();
    const normalizedUserId = String(userId || "").trim();
    const normalizedRole = String(role || "").trim();

    if (!normalizedUserId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const updatePayload: Record<string, unknown> = {};

    if (typeof isApproved === "boolean") {
      updatePayload.isApproved = isApproved;
      updatePayload.approvedAt = isApproved ? new Date() : undefined;
      updatePayload.approvedBy = isApproved ? authUser.userId : "";
    }

    if (normalizedRole) {
      if (!["swimmer", "coach", "admin"].includes(normalizedRole)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      updatePayload.role = normalizedRole;

      if (normalizedRole !== "swimmer") {
        updatePayload.isApproved = true;
        updatePayload.approvedAt = new Date();
        updatePayload.approvedBy = authUser.userId;
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 },
      );
    }

    await dbConnect();

    const updatedUser = await User.findByIdAndUpdate(
      normalizedUserId,
      updatePayload,
      {
        new: true,
        runValidators: true,
      },
    )
      .select("_id email role isApproved profile")
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Users update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
