import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/jwt";
import dbConnect from "@/lib/mongodb";
import Announcement from "@/models/Announcement";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({ success: true, announcements });
  } catch (error) {
    console.error("Announcements GET error:", error);
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const priority = String(body.priority || "medium")
      .trim()
      .toLowerCase();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 },
      );
    }

    if (!["low", "medium", "high"].includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }

    await dbConnect();

    const dbUser = await User.findById(authUser.userId)
      .select("profile")
      .lean();
    const profile = (dbUser?.profile || {}) as {
      callingName?: string;
      fullName?: string;
    };

    const announcement = await Announcement.create({
      title,
      content,
      priority,
      postedBy: authUser.userId,
      postedByName: profile.callingName || profile.fullName || authUser.email,
    });

    return NextResponse.json({ success: true, announcement }, { status: 201 });
  } catch (error) {
    console.error("Announcements POST error:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
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

    if (authUser.role !== "admin" && authUser.role !== "coach") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const announcementId = String(body.announcementId || "").trim();
    const status = String(body.status || "")
      .trim()
      .toLowerCase();

    if (!announcementId) {
      return NextResponse.json(
        { error: "announcementId is required" },
        { status: 400 },
      );
    }

    if (!["active", "cancelled", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await dbConnect();

    const updated = await Announcement.findByIdAndUpdate(
      announcementId,
      {
        $set: {
          status,
          cancelledBy: status === "cancelled" ? authUser.userId : "",
          cancelledAt: status === "cancelled" ? new Date() : undefined,
          completedBy: status === "completed" ? authUser.userId : "",
          completedAt: status === "completed" ? new Date() : undefined,
        },
      },
      { new: true },
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, announcement: updated });
  } catch (error) {
    console.error("Announcements PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 },
    );
  }
}
