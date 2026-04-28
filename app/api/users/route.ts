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
    const body = await req.json();
    const { userId, isApproved, role, profile } = body || {};
    const normalizedUserId = String(userId || "").trim();
    const normalizedRole = String(role || "").trim();

    if (!normalizedUserId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    const topLevelUpdates: Record<string, unknown> = {};
    const setOps: Record<string, unknown> = {};

    if (typeof isApproved === "boolean") {
      topLevelUpdates.isApproved = isApproved;
      topLevelUpdates.approvedAt = isApproved ? new Date() : undefined;
      topLevelUpdates.approvedBy = isApproved ? authUser.userId : "";
    }

    if (normalizedRole) {
      if (!["swimmer", "coach", "admin"].includes(normalizedRole)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      topLevelUpdates.role = normalizedRole;

      if (normalizedRole !== "swimmer") {
        topLevelUpdates.isApproved = true;
        topLevelUpdates.approvedAt = new Date();
        topLevelUpdates.approvedBy = authUser.userId;
      }
    }

    // Allow safe, partial updates to select profile fields via dot-set so we
    // don't overwrite the entire profile object. Only permit known keys.
    if (profile && typeof profile === "object") {
      const allowed = [
        "fullName",
        "gender",
        "dob",
        "universityId",
        "nicNumber",
        "faculty",
        "batch",
        "contact",
        "emergencyContact",
        "mainEvents",
        "extraEvents",
      ];

      for (const key of Object.keys(profile)) {
        if (!allowed.includes(key)) continue;
        const val = (profile as Record<string, unknown>)[key];

        // basic validation for arrays
        if ((key === "mainEvents" || key === "extraEvents") && val) {
          if (!Array.isArray(val)) {
            return NextResponse.json(
              { error: `${key} must be an array` },
              { status: 400 },
            );
          }
        }

        setOps[`profile.${key}`] = val;
      }
    }

    if (
      Object.keys(topLevelUpdates).length === 0 &&
      Object.keys(setOps).length === 0
    ) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 },
      );
    }

    await dbConnect();

    const updateQuery: Record<string, unknown> = { ...topLevelUpdates };
    if (Object.keys(setOps).length > 0) {
      updateQuery["$set"] = setOps;
    }

    const updatedUser = await User.findByIdAndUpdate(
      normalizedUserId,
      updateQuery,
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

export async function DELETE(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await req.json();
    const normalizedUserId = String(userId || "").trim();

    if (!normalizedUserId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    if (normalizedUserId === authUser.userId) {
      return NextResponse.json(
        { error: "You cannot remove your own account" },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findById(normalizedUserId)
      .select("_id role isApproved")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { error: "Admin accounts cannot be removed" },
        { status: 400 },
      );
    }

    if (user.isApproved) {
      return NextResponse.json(
        { error: "Only pending users can be removed from this action" },
        { status: 400 },
      );
    }

    await User.findByIdAndDelete(normalizedUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Users delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
