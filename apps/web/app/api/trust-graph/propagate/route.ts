import { NextResponse } from "next/server";
import { TrustGraphEngine } from "@ubuntu/reputation/graph-engine";

const engine = new TrustGraphEngine();

export async function POST() {
  try {
    const scores = engine.recalculateScores();
    const result = Object.fromEntries(scores);
    return NextResponse.json({ recalculated: true, nodeCount: scores.size, scores: result });
  } catch (error) {
    return NextResponse.json({ error: "Failed to propagate scores" }, { status: 500 });
  }
}
