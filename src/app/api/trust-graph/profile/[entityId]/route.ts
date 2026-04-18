import { NextRequest, NextResponse } from "next/server";
import { TrustGraphEngine } from "@ubuntu/reputation/graph-engine";
import { calculateGraphTrustScore } from "@ubuntu/reputation/score-calculator";
import { generateTrustProfile, filterByAccessLevel } from "@ubuntu/reputation/privacy-layer";

const engine = new TrustGraphEngine();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entityId: string }> }
) {
  try {
    const { entityId } = await params;
    const accessLevel = (request.nextUrl.searchParams.get("accessLevel") ?? "public") as
      | "public"
      | "partners"
      | "private";
    const entityType = request.nextUrl.searchParams.get("entityType") ?? "user";

    const node = engine.getNodeByEntity(entityId, entityType);
    if (!node) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    const { edges } = filterByAccessLevel(
      accessLevel,
      engine.getAllNodes(),
      engine.getAllEdges()
    );

    const components = calculateGraphTrustScore(node.id, edges, engine.getAllNodes());
    const profile = generateTrustProfile(node, accessLevel, edges, components);

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
