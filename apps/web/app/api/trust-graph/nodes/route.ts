import { NextRequest, NextResponse } from "next/server";
import { GraphNodeInputSchema } from "@/lib/trust-graph/types";
import { TrustGraphEngine } from "@/lib/trust-graph/graph-engine";

const engine = new TrustGraphEngine();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entityType");
    const minScore = searchParams.get("minTrustScore");

    let nodes = engine.getAllNodes();

    if (entityType) {
      nodes = nodes.filter((n) => n.entityType === entityType);
    }
    if (minScore) {
      const min = parseInt(minScore, 10);
      if (!isNaN(min)) nodes = nodes.filter((n) => n.trustScore >= min);
    }

    return NextResponse.json({ nodes });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch nodes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = GraphNodeInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const node = engine.upsertNode(parsed.data);
    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create node" }, { status: 500 });
  }
}
