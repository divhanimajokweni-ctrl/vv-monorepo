import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TrustGraphEngine } from "@/lib/trust-graph/graph-engine";
import { calculateGraphTrustScore } from "@/lib/trust-graph/score-calculator";

const engine = new TrustGraphEngine();

const ScoreRequestSchema = z.object({
  nodeId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ScoreRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const node = engine.getNode(parsed.data.nodeId);
    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    const components = calculateGraphTrustScore(
      node.id,
      engine.getAllEdges(),
      engine.getAllNodes()
    );

    return NextResponse.json({ nodeId: node.id, ...components });
  } catch (error) {
    return NextResponse.json({ error: "Failed to calculate score" }, { status: 500 });
  }
}
