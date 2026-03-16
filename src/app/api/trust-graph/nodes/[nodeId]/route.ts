import { NextRequest, NextResponse } from "next/server";
import { TrustGraphEngine } from "@/lib/trust-graph/graph-engine";

const engine = new TrustGraphEngine();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const node = engine.getNode(nodeId);
    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    const neighbors = engine.getNeighbors(nodeId, 1);
    return NextResponse.json({ node, neighbors });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch node" }, { status: 500 });
  }
}
