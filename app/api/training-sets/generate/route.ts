import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import TrainingSet from "@/models/TrainingSet";
import {
  generateTrainingSet,
  checkRateLimit,
  TEMPORARY_AI_ERROR,
} from "@/lib/gemini";
import { getUserFromRequest } from "@/lib/jwt";
import { createRateLimiter, getRequestIdentifier } from "@/lib/security";

const generateSetLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60_000,
});

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = getRequestIdentifier(req);
    const limit = generateSetLimiter(clientId);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many AI generation requests. Please wait a bit." },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSeconds),
            "Cache-Control": "no-store",
          },
        },
      );
    }

    if (!checkRateLimit()) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a minute." },
        { status: 429 },
      );
    }

    const { type, focus } = await req.json();

    if (!type || !["swimming", "land"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid training set type" },
        { status: 400 },
      );
    }

    await dbConnect();

    const previousSets = await TrainingSet.find({ type })
      .sort({ date: -1 })
      .limit(15)
      .select("content");

    const previousSetContents = previousSets.map((set) => set.content);

    if (previousSetContents.length < 3) {
      return NextResponse.json(
        {
          error: "More posted sets are needed first",
          suggestion:
            "At least 3 previous sets are required for style learning.",
        },
        { status: 400 },
      );
    }

    const generatedSet = await generateTrainingSet({
      type,
      focus,
      previousSets: previousSetContents,
    });

    return NextResponse.json({
      success: true,
      content: generatedSet,
      message: "Set generated! You can regenerate or export this set.",
      canRegenerate: true,
    });
  } catch (error) {
    console.error("Generate set error:", error);

    if (error instanceof Error && error.message === TEMPORARY_AI_ERROR) {
      return NextResponse.json(
        {
          error:
            "AI service is currently under high demand. Please try again in a minute.",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { error: "Failed to generate training set" },
      { status: 500 },
    );
  }
}
