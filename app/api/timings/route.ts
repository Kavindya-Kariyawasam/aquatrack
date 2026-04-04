import { NextRequest, NextResponse } from "next/server";
import { SWIMMING_EVENTS } from "@/lib/constants";
import { getUserFromRequest } from "@/lib/jwt";
import dbConnect from "@/lib/mongodb";
import { isValidTimeFormat } from "@/lib/utils";
import Timing from "@/models/Timing";

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    const userId =
      (authUser.role === "admin" || authUser.role === "coach") &&
      requestedUserId
        ? requestedUserId
        : authUser.userId;

    await dbConnect();

    const timings = await Timing.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, timings });
  } catch (error) {
    console.error("Timings GET error:", error);
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

    const event = String(body.event || "")
      .trim()
      .toLowerCase();
    const time = String(body.time || "").trim();
    const type = String(body.type || "trial")
      .trim()
      .toLowerCase();
    const date = body.date ? new Date(body.date) : new Date();
    const meetName = String(body.meetName || "").trim();
    const notes = String(body.notes || "").trim();

    if (!SWIMMING_EVENTS.includes(event as (typeof SWIMMING_EVENTS)[number])) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    if (!isValidTimeFormat(time)) {
      return NextResponse.json(
        { error: "Invalid time format. Use MM:SS.MS or SS.MS" },
        { status: 400 },
      );
    }

    if (type !== "trial" && type !== "meet") {
      return NextResponse.json(
        { error: "Invalid timing type" },
        { status: 400 },
      );
    }

    const requestedUserId = String(body.userId || "").trim();
    const userId =
      requestedUserId &&
      (authUser.role === "admin" || authUser.role === "coach")
        ? requestedUserId
        : authUser.userId;

    await dbConnect();

    const timing = await Timing.create({
      userId,
      event,
      time,
      type,
      date,
      meetName,
      notes,
    });

    return NextResponse.json({ success: true, timing }, { status: 201 });
  } catch (error) {
    console.error("Timings POST error:", error);
    return NextResponse.json(
      { error: "Failed to add timing" },
      { status: 500 },
    );
  }
}
