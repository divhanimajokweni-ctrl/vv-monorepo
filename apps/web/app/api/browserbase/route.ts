import { Browserbase } from "@browserbasehq/sdk";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const bb = new Browserbase({
      apiKey: process.env.BROWSERBASE_API_KEY!,
    });

    const session = await bb.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
      // Add configuration options here
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating browser session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}