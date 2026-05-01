import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/jwt";
import MeetCatalog from "@/models/MeetCatalog";

function normalizeMeetName(raw: string) {
  return raw.replace(/\s+/g, " ").trim();
}

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = normalizeMeetName(
      String(searchParams.get("q") || ""),
    ).toLowerCase();

    await dbConnect();

    const filter = q
      ? {
          normalizedName: {
            $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        }
      : {};

    const meets = await MeetCatalog.find(filter)
      .select("name type createdAt")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({ success: true, meets });
  } catch (error) {
    console.error("Meets GET error:", error);
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

    if (authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const name = normalizeMeetName(String(body.name || ""));
    const type = String(body.type || "")
      .trim()
      .toLowerCase();

    if (!name) {
      return NextResponse.json(
        { error: "Meet name is required" },
        { status: 400 },
      );
    }

    if (type !== "meet" && type !== "trial") {
      return NextResponse.json({ error: "Invalid meet type" }, { status: 400 });
    }

    await dbConnect();

    const normalizedName = name.toLowerCase();

    const existing = await MeetCatalog.findOne({ normalizedName }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "Meet name already exists" },
        { status: 409 },
      );
    }

    const meet = await MeetCatalog.create({
      name,
      normalizedName,
      type,
      createdBy: authUser.userId,
    });

    return NextResponse.json({ success: true, meet }, { status: 201 });
  } catch (error) {
    console.error("Meets POST error:", error);
    return NextResponse.json({ error: "Failed to add meet" }, { status: 500 });
  }
}
