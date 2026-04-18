import { NextResponse } from "next/server";
import {
  demandAggregation,
  supplyAggregation,
  supplierMatching,
  contractNegotiation,
  orderSettlement,
  procurementCircle,
  marketIntel,
} from "@ubuntu/villages";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "createDemand": {
        const demand = await demandAggregation.createDemand(data);
        return NextResponse.json(demand);
      }

      case "createSupply": {
        const supply = await supplyAggregation.createSupply(data);
        return NextResponse.json(supply);
      }

      case "registerSupplier": {
        const supplier = await supplierMatching.registerSupplier(data);
        return NextResponse.json(supplier);
      }

      case "verifySupplier": {
        const supplier = await supplierMatching.verifySupplier(data.supplierId);
        return NextResponse.json(supplier);
      }

      case "submitBid": {
        const bid = await contractNegotiation.submitBid(data);
        return NextResponse.json(bid);
      }

      case "createContract": {
        const contract = await contractNegotiation.createContract(data);
        return NextResponse.json(contract);
      }

      case "signContract": {
        const contract = await contractNegotiation.signContract(data.contractId);
        return NextResponse.json(contract);
      }

      case "createCircle": {
        const circle = await procurementCircle.createCircle(data);
        return NextResponse.json(circle);
      }

      case "joinCircle": {
        const circle = await procurementCircle.joinCircle(data.circleId, data.villageId);
        return NextResponse.json(circle);
      }

      case "lockCircleDemand": {
        const circle = await procurementCircle.lockCircleDemand(data.circleId);
        return NextResponse.json(circle);
      }

      case "initiateSettlement": {
        const settlement = await orderSettlement.initiateSettlement(
          data.contractId,
          data.villageId
        );
        return NextResponse.json(settlement);
      }

      case "confirmPayment": {
        const settlement = await orderSettlement.confirmPayment(
          data.settlementId,
          data.paymentReference
        );
        return NextResponse.json(settlement);
      }

      case "confirmReceipt": {
        const settlement = await orderSettlement.confirmReceipt(data.settlementId);
        return NextResponse.json(settlement);
      }

      case "raiseDispute": {
        const settlement = await orderSettlement.raiseDispute(
          data.settlementId,
          data.reason
        );
        return NextResponse.json(settlement);
      }

      case "recordTransaction": {
        await marketIntel.recordTransaction(data);
        return NextResponse.json({ success: true });
      }

      case "updateDemandStatus": {
        const demand = await demandAggregation.updateDemandStatus(
          data.demandId,
          data.status
        );
        return NextResponse.json(demand);
      }

      case "shortlistBid": {
        const bid = await contractNegotiation.shortlistBid(data.bidId);
        return NextResponse.json(bid);
      }

      case "acceptBid": {
        const bid = await contractNegotiation.acceptBid(data.bidId);
        return NextResponse.json(bid);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("CPME API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    switch (action) {
      case "getDemand": {
        const demands = await demandAggregation.getVillageDemands(id!);
        return NextResponse.json(demands);
      }

      case "getOpenDemands": {
        const demands = await demandAggregation.getOpenDemands(category || undefined);
        return NextResponse.json(demands);
      }

      case "getCircleDemandSummary": {
        const summary = await demandAggregation.getCircleDemandSummary(id!);
        return NextResponse.json(summary);
      }

      case "getSupply": {
        const supplies = await supplyAggregation.getVillageSupplies(id!);
        return NextResponse.json(supplies);
      }

      case "getOpenSupplies": {
        const supplies = await supplyAggregation.getOpenSupplies(category || undefined);
        return NextResponse.json(supplies);
      }

      case "getSupplier": {
        const supplier = await supplierMatching.getSupplier(id!);
        return NextResponse.json(supplier);
      }

      case "listSuppliers": {
        const suppliers = await supplierMatching.listSuppliers({
          category: category || undefined,
          status: status || undefined,
        });
        return NextResponse.json(suppliers);
      }

      case "matchSuppliers": {
        const suppliers = await supplierMatching.matchSuppliersToDemand(id!, {
          category: category || undefined,
          minTrustScore: searchParams.get("minTrustScore")
            ? parseInt(searchParams.get("minTrustScore")!)
            : undefined,
          region: searchParams.get("region") || undefined,
        });
        return NextResponse.json(suppliers);
      }

      case "getBids": {
        const bids = await contractNegotiation.getBidsForDemand(id!);
        return NextResponse.json(bids);
      }

      case "getContracts": {
        const contracts = await contractNegotiation.getContracts({
          supplierId: id || undefined,
          circleId: searchParams.get("circleId") || undefined,
          status: status || undefined,
        });
        return NextResponse.json(contracts);
      }

      case "getSettlement": {
        const settlement = await orderSettlement.getSettlement(id!);
        return NextResponse.json(settlement);
      }

      case "getContractSettlements": {
        const settlements = await orderSettlement.getContractSettlements(id!);
        return NextResponse.json(settlements);
      }

      case "getCircle": {
        const circle = await procurementCircle.getCircle(id!);
        return NextResponse.json(circle);
      }

      case "listCircles": {
        const circles = await procurementCircle.getCircles({
          category: category || undefined,
          status: status || undefined,
        });
        return NextResponse.json(circles);
      }

      case "getIntelligence": {
        const intelligence = await marketIntel.getIntelligence(
          category || undefined,
          searchParams.get("product") || undefined,
          searchParams.get("region") || undefined
        );
        return NextResponse.json(intelligence);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("CPME GET API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
