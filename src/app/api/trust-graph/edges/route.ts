import { NextRequest, NextResponse } from "next/server";
import { GraphEdgeInputSchema } from "@ubuntu/reputation/trust-graph/types";
import { TrustGraphEngine } from "@ubuntu/reputation/graph-engine";

const engine = new TrustGraphEngine();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const edgeType = searchParams.get("edgeType");

    let edges = engine.getAllEdges();
    if (edgeType) {
      edges = edges.filter((e) => e.edgeType === edgeType);
    }

    return NextResponse.json({ edges });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch edges" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = GraphEdgeInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const edge = engine.upsertEdge(parsed.data);
    return NextResponse.json({ edge }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create edge" }, { status: 500 });
  }
}
