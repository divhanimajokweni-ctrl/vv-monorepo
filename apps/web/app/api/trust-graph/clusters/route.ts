import { NextResponse } from "next/server";
import { TrustGraphEngine } from "@/lib/trust-graph/graph-engine";
import { detectClusters } from "@/lib/trust-graph/cluster-detector";

const engine = new TrustGraphEngine();

export async function GET() {
  try {
    const clusters = detectClusters(engine.getAllNodes(), engine.getAllEdges());
    return NextResponse.json({ clusters });
  } catch (error) {
    return NextResponse.json({ error: "Failed to detect clusters" }, { status: 500 });
  }
}
