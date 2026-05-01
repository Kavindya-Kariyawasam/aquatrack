import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { SWIMMING_EVENTS } from "@/lib/constants";
import { getUserFromRequest } from "@/lib/jwt";
import User from "@/models/User";
import {
  isValidNICNumber,
  isValidUniversityId,
  isValidBatch,
} from "@/lib/utils";

const ALLOWED_FIELDS = [
  "fullName",
  "callingName",
  "gender",
  "dob",
  "contact",
  "emergencyContact",
  "faculty",
  "batch",
  "universityId",
  "nicNumber",
  "mainEvents",
  "extraEvents",
] as const;

function sanitizeEvents(events: unknown, max: number) {
  if (!Array.isArray(events)) return [];

  return events
    .map((event) => String(event).trim().toLowerCase())
    .filter((event) =>
      SWIMMING_EVENTS.includes(event as (typeof SWIMMING_EVENTS)[number]),
    )
    .slice(0, max);
}

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(authUser.userId)
      .select("email role profile")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("User profile GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const isSwimmer = authUser.role === "swimmer";

    const updates: Record<string, unknown> = {};

    for (const key of ALLOWED_FIELDS) {
      if (key in body) {
        updates[`profile.${key}`] = body[key];
      }
    }

    if (isSwimmer) {
      // Validate NIC number if provided
      if (body.nicNumber && !isValidNICNumber(body.nicNumber)) {
        return NextResponse.json(
          { error: "NIC must be exactly 12 digits" },
          { status: 400 },
        );
      }

      // Validate University ID if provided
      if (body.universityId && !isValidUniversityId(body.universityId)) {
        return NextResponse.json(
          { error: "University ID must be 6 digits followed by 1 letter" },
          { status: 400 },
        );
      }

      // Validate Batch if provided
      if (
        body.batch !== undefined &&
        body.batch !== null &&
        body.batch !== ""
      ) {
        if (!isValidBatch(body.batch)) {
          return NextResponse.json(
            { error: "Batch must be between 10 and 99" },
            { status: 400 },
          );
        }
      }

      const mainEvents = sanitizeEvents(body.mainEvents, 3);
      const extraEvents = sanitizeEvents(body.extraEvents, 2).filter(
        (event) => !mainEvents.includes(event),
      );

      updates["profile.mainEvents"] = mainEvents;
      updates["profile.extraEvents"] = extraEvents;
    } else {
      delete updates["profile.mainEvents"];
      delete updates["profile.extraEvents"];
      delete updates["profile.faculty"];
      delete updates["profile.batch"];
      delete updates["profile.universityId"];
      delete updates["profile.nicNumber"];
    }

    await dbConnect();

    const updated = await User.findByIdAndUpdate(
      authUser.userId,
      { $set: updates },
      { new: true, runValidators: true },
    )
      .select("email role profile")
      .lean();

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("User profile PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
