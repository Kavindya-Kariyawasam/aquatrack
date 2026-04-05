import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/jwt";
import dbConnect from "@/lib/mongodb";
import TrainingSet from "@/models/TrainingSet";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const date = String(searchParams.get("date") || "").trim();
    const month = String(searchParams.get("month") || "").trim();
    const limit = Number(searchParams.get("limit") || 30);

    await dbConnect();

    const query: Record<string, unknown> =
      type && ["swimming", "land"].includes(type) ? { type } : {};

    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      query.date = { $gte: start, $lte: end };
    } else if (/^\d{4}-\d{2}$/.test(month)) {
      const [yearText, monthText] = month.split("-");
      const year = Number(yearText);
      const monthIndex = Number(monthText) - 1;
      const startDate = new Date(Date.UTC(year, monthIndex, 1));
      const endDate = new Date(Date.UTC(year, monthIndex + 1, 1));
      query.date = { $gte: startDate, $lt: endDate };
    }

    if (authUser.role === "swimmer") {
      Object.assign(query, {
        $or: [
          { isPrivate: { $ne: true } },
          { isPrivate: true, assignedToUserId: authUser.userId },
        ],
      });
    }

    const sets = await TrainingSet.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(Math.min(limit, 100))
      .lean();

    let privateSet = null;
    if (authUser.role === "swimmer") {
      privateSet = await TrainingSet.findOne({
        isPrivate: true,
        assignedToUserId: authUser.userId,
        ...(type && ["swimming", "land"].includes(type) ? { type } : {}),
      })
        .sort({ updatedAt: -1 })
        .lean();
    }

    const availableDates = Array.from(
      new Set(sets.map((set) => new Date(set.date).toISOString().slice(0, 10))),
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      sets,
      availableDates,
      privateSet,
    });
  } catch (error) {
    console.error("Training sets GET error:", error);
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

    if (authUser.role !== "coach" && authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const type = String(body.type || "")
      .trim()
      .toLowerCase();
    const content = String(body.content || "").trim();
    const imageUrl = String(body.imageUrl || "").trim();
    const extractedText = String(body.extractedText || "").trim();
    const isAIGenerated = Boolean(body.isAIGenerated);
    const date = body.date ? new Date(body.date) : new Date();

    if (type !== "swimming" && type !== "land") {
      return NextResponse.json(
        { error: "Invalid training type" },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const dbUser = await User.findById(authUser.userId)
      .select("profile")
      .lean();
    const profile = (dbUser?.profile || {}) as {
      callingName?: string;
      fullName?: string;
    };

    const trainingSet = await TrainingSet.create({
      type,
      date,
      content,
      imageUrl,
      extractedText,
      postedBy: authUser.userId,
      postedByName: profile.callingName || profile.fullName || authUser.email,
      isAIGenerated,
    });

    return NextResponse.json({ success: true, trainingSet }, { status: 201 });
  } catch (error) {
    console.error("Training sets POST error:", error);
    return NextResponse.json(
      { error: "Failed to create training set" },
      { status: 500 },
    );
  }
}
