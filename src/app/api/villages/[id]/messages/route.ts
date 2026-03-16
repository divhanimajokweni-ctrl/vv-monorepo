/**
 * Ubuntu Pools — Village Messages API
 */

import { NextRequest, NextResponse } from "next/server";
import { villageService } from "@/lib/services/village-service";
import { z } from "zod";

const SendMessageSchema = z.object({
  channel: z.string().min(1).max(50).default("general"),
  content: z.string().min(1).max(5000),
  isEncrypted: z.boolean().default(false),
  eventReference: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: villageId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const channel = searchParams.get("channel") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const messages = await villageService.getVillageMessages(
      villageId,
      channel,
      Math.min(limit, 200)
    );

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[GET /api/villages/[id]/messages] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to get messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: villageId } = await params;
    const senderId = request.headers.get("x-user-id");

    if (!senderId) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "User ID required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = SendMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: result.error.issues },
        { status: 400 }
      );
    }

    const message = await villageService.sendMessage({
      villageId,
      senderId,
      ...result.data,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[POST /api/villages/[id]/messages] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to send message" },
      { status: 500 }
    );
  }
}
