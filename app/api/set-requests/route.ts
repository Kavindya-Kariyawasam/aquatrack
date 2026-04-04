import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/jwt";
import dbConnect from "@/lib/mongodb";
import SetRequest from "@/models/SetRequest";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const isManager = authUser.role === "admin" || authUser.role === "coach";
    const query = isManager ? {} : { userId: authUser.userId };

    const requests = await SetRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("Set request GET error:", error);
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
    const type = String(body.type || "")
      .trim()
      .toLowerCase();
    const message = String(body.message || "")
      .trim()
      .slice(0, 500);

    if (type !== "swimming" && type !== "land") {
      return NextResponse.json({ error: "Invalid set type" }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json(
        { error: "Request message is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const user = await User.findById(authUser.userId)
      .select("profile email")
      .lean();
    const profile = user?.profile as {
      callingName?: string;
      fullName?: string;
    };
    const userName =
      profile?.callingName ||
      profile?.fullName ||
      user?.email ||
      authUser.email;

    const requestDoc = await SetRequest.create({
      userId: authUser.userId,
      userName,
      type,
      message,
      status: "pending",
    });

    return NextResponse.json(
      { success: true, request: requestDoc },
      { status: 201 },
    );
  } catch (error) {
    console.error("Set request POST error:", error);
    return NextResponse.json(
      { error: "Failed to create set request" },
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
    const requestId = String(body.requestId || "").trim();
    const status = String(body.status || "").trim();
    const response = String(body.response || "")
      .trim()
      .slice(0, 500);

    if (!requestId) {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 },
      );
    }

    if (!["pending", "approved", "fulfilled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await dbConnect();

    const updated = await SetRequest.findByIdAndUpdate(
      requestId,
      {
        $set: {
          status,
          response,
          fulfilledBy: authUser.userId,
        },
      },
      { new: true },
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("Set request PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update set request" },
      { status: 500 },
    );
  }
}
