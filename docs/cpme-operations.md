# CPME Operations Guide

## Overview

The Collective Procurement & Market Engine (CPME) enables villages to pool buying/selling power for bulk negotiation. This guide covers all operational workflows.

---

## 1. Procurement Circles (Buying Collectives)

### Create a Circle

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createCircle",
    "data": {
      "name": "Farming Cooperative Seeds",
      "description": "Bulk seed purchasing for all farming villages",
      "category": "agriculture",
      "creatorVillageId": "uuid-of-creator-village",
      "minVillages": 3,
      "maxVillages": 50,
      "coordinationFeePercent": 50,
      "deadline": "2026-04-01T00:00:00Z"
    }
  }'
```

### Join a Circle

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "joinCircle",
    "data": {
      "circleId": "uuid-of-circle",
      "villageId": "uuid-of-joining-village"
    }
  }'
```

### Lock Demand (Start Negotiation)

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "lockCircleDemand",
    "data": {
      "circleId": "uuid-of-circle"
    }
  }'
```

---

## 2. Village Demands (Buying Requests)

### Create Demand

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createDemand",
    "data": {
      "villageId": "uuid-of-village",
      "circleId": "uuid-of-circle (optional)",
      "product": "Maize Seeds",
      "category": "agriculture",
      "description": "Quality maize seeds for planting season",
      "quantity": 200,
      "unit": "bags",
      "individualPrice": 500,
      "targetPrice": 380,
      "urgency": "high",
      "deliveryLocation": {
        "country": "South Africa",
        "region": "Limpopo"
      },
      "deadline": "2026-03-31T00:00:00Z"
    }
  }'
```

### Update Demand Status

```bash
# Available statuses: draft, open, aggregating, locked, fulfilled, cancelled
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "updateDemandStatus",
    "data": {
      "demandId": "uuid-of-demand",
      "status": "open"
    }
  }'
```

### Get Open Demands

```bash
curl "http://localhost:3000/api/cpme?action=getOpenDemands&category=agriculture"
```

---

## 3. Village Supplies (Selling Requests)

### Create Supply

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createSupply",
    "data": {
      "villageId": "uuid-of-village",
      "product": "Maize",
      "category": "agriculture",
      "description": "Fresh maize harvest 2026",
      "quantity": 20000,
      "unit": "kg",
      "askingPrice": 8,
      "minPrice": 6,
      "quality": "premium",
      "harvestDate": "2026-03-01T00:00:00Z",
      "location": {
        "country": "South Africa",
        "region": "Limpopo"
      },
      "deadline": "2026-04-30T00:00:00Z"
    }
  }'
```

---

## 4. Supplier Management

### Register Supplier

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "registerSupplier",
    "data": {
      "name": "AgriSupplies Pty Ltd",
      "description": "Leading agricultural inputs supplier",
      "businessType": "distributor",
      "registrationNumber": "2021/123456/07",
      "contactEmail": "sales@agrisupplies.co.za",
      "contactPhone": "+27123456789",
      "address": {
        "street": "123 Main Street",
        "city": "Polokwane",
        "country": "South Africa"
      },
      "categories": ["agriculture", "seeds", "fertilizer"],
      "certifications": ["ISO 9001", "Organic Certified"],
      "minOrderValue": 10000,
      "maxOrderCapacity": 1000000,
      "paymentTerms": "net_30",
      "deliveryRegions": ["Limpopo", "Mpumalanga", "Gauteng"]
    }
  }'
```

### Verify Supplier

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "verifySupplier",
    "data": {
      "supplierId": "uuid-of-supplier"
    }
  }'
```

### List Suppliers

```bash
curl "http://localhost:3000/api/cpme?action=listSuppliers&status=verified&category=agriculture"
```

### Match Suppliers to Demand

```bash
curl "http://localhost:3000/api/cpme?action=matchSuppliers&id=uuid-of-demand&minTrustScore=400"
```

---

## 5. Bidding & Contracts

### Submit Bid (Supplier)

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "submitBid",
    "data": {
      "demandId": "uuid-of-demand",
      "circleId": "uuid-of-circle (optional)",
      "supplierId": "uuid-of-supplier",
      "unitPrice": 380,
      "quantityOffered": 200,
      "deliveryTime": 7,
      "deliveryTerms": "FOB Polokwane",
      "paymentTerms": "net_15",
      "warranty": "90 days",
      "additionalNotes": "Bulk discount available for orders over 500 bags",
      "expiresAt": "2026-03-25T00:00:00Z"
    }
  }'
```

### Get Bids for Demand

```bash
curl "http://localhost:3000/api/cpme?action=getBids&id=uuid-of-demand"
```

### Shortlist Bid

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "shortlistBid",
    "data": {
      "bidId": "uuid-of-bid"
    }
  }'
```

### Accept Bid & Create Contract

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "acceptBid",
    "data": {
      "bidId": "uuid-of-winning-bid"
    }
  }'
```

Then create the contract:

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createContract",
    "data": {
      "circleId": "uuid-of-circle",
      "demandId": "uuid-of-demand",
      "supplierId": "uuid-of-supplier",
      "winningBidId": "uuid-of-winning-bid",
      "memberVillageIds": ["uuid-village-1", "uuid-village-2"],
      "product": "Maize Seeds",
      "quantity": 200,
      "unit": "bags",
      "unitPrice": 380,
      "coordinationFeePercent": 50,
      "deliveryTerms": "FOB Polokwane",
      "paymentTerms": "net_15",
      "deliveryDeadline": "2026-04-15T00:00:00Z"
    }
  }'
```

### Sign Contract

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "signContract",
    "data": {
      "contractId": "uuid-of-contract"
    }
  }'
```

---

## 6. Order Settlement

### Initiate Settlement (Village Pays)

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "initiateSettlement",
    "data": {
      "contractId": "uuid-of-contract",
      "villageId": "uuid-of-paying-village"
    }
  }'
```

### Confirm Payment

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "confirmPayment",
    "data": {
      "settlementId": "uuid-of-settlement",
      "paymentReference": "PAY-123456"
    }
  }'
```

### Mark Shipped

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "markShipped",
    "data": {
      "settlementId": "uuid-of-settlement",
      "trackingNumber": "TRACK-789"
    }
  }'
```

### Confirm Receipt

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "confirmReceipt",
    "data": {
      "settlementId": "uuid-of-settlement"
    }
  }'
```

### Raise Dispute

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "raiseDispute",
    "data": {
      "settlementId": "uuid-of-settlement",
      "reason": "Items received damaged"
    }
  }'
```

---

## 7. Market Intelligence

### Record Transaction (After Completion)

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "recordTransaction",
    "data": {
      "category": "agriculture",
      "product": "Maize Seeds",
      "region": "Limpopo",
      "quantity": 200,
      "price": 380,
      "villageCount": 5,
      "savingsPercent": 24
    }
  }'
```

### Get Intelligence

```bash
curl "http://localhost:3000/api/cpme?action=getIntelligence&category=agriculture"
```

---

## 8. Query Operations

### Get Village Demands

```bash
curl "http://localhost:3000/api/cpme?action=getDemand&id=uuid-of-village"
```

### Get Circle Details

```bash
curl "http://localhost:3000/api/cpme?action=getCircle&id=uuid-of-circle"
```

### Get Circle Demand Summary

```bash
curl "http://localhost:3000/api/cpme?action=getCircleDemandSummary&id=uuid-of-circle"
```

### List Circles

```bash
# All active circles
curl "http://localhost:3000/api/cpme?action=listCircles&status=active"

# By category
curl "http://localhost:3000/api/cpme?action=listCircles&category=agriculture"
```

### Get Contracts

```bash
# By supplier
curl "http://localhost:3000/api/cpme?action=getContracts&status=active"

# By circle
curl "http://localhost:3000/api/cpme?action=getContracts&circleId=uuid-of-circle"
```

---

## 9. Example Workflow: Farming Village Seeds Purchase

### Step 1: Create Procurement Circle

```bash
# Village A creates a seed buying circle
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createCircle",
    "data": {
      "name": "Spring 2026 Seed Circle",
      "category": "agriculture",
      "creatorVillageId": "village-a-uuid",
      "minVillages": 3,
      "deadline": "2026-03-15T00:00:00Z"
    }
  }'
# Returns: circleId = "circle-uuid"
```

### Step 2: Other Villages Join

```bash
# Village B joins
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "joinCircle",
    "data": { "circleId": "circle-uuid", "villageId": "village-b-uuid" }
  }'

# Village C joins
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "joinCircle",
    "data": { "circleId": "circle-uuid", "villageId": "village-c-uuid" }
  }'
```

### Step 3: Each Village Creates Demand

```bash
# Each village submits their seed requirements
for village in village-a village-b village-c; do
  curl -X POST http://localhost:3000/api/cpme \
    -H "Content-Type: application/json" \
    -d "{
      \"action\": \"createDemand\",
      \"data\": {
        \"villageId\": \"$village-uuid\",
        \"circleId\": \"circle-uuid\",
        \"product\": \"Maize Seeds\",
        \"category\": \"agriculture\",
        \"quantity\": 200,
        \"unit\": \"bags\",
        \"individualPrice\": 500,
        \"targetPrice\": 380
      }
    }"
done
```

### Step 4: Lock Demand & Open to Suppliers

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "lockCircleDemand",
    "data": { "circleId": "circle-uuid" }
  }'
```

### Step 5: Suppliers Submit Bids

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "submitBid",
    "data": {
      "demandId": "demand-uuid",
      "circleId": "circle-uuid",
      "supplierId": "supplier-uuid",
      "unitPrice": 380,
      "quantityOffered": 600,
      "deliveryTime": 7
    }
  }'
```

### Step 6: Village Votes on Best Bid

```bash
# (This would be done through governance proposal system)
# Once approved, accept the bid
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "acceptBid",
    "data": { "bidId": "winning-bid-uuid" }
  }'
```

### Step 7: Create & Sign Contract

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createContract",
    "data": {
      "circleId": "circle-uuid",
      "demandId": "demand-uuid",
      "supplierId": "supplier-uuid",
      "winningBidId": "winning-bid-uuid",
      "memberVillageIds": ["village-a-uuid", "village-b-uuid", "village-c-uuid"],
      "product": "Maize Seeds",
      "quantity": 600,
      "unit": "bags",
      "unitPrice": 380,
      "deliveryTerms": "FOB Polokwane",
      "paymentTerms": "net_15"
    }
  }'

curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "signContract",
    "data": { "contractId": "contract-uuid" }
  }'
```

### Step 8: Execute Settlement

```bash
# Village A initiates payment
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "initiateSettlement",
    "data": {
      "contractId": "contract-uuid",
      "villageId": "village-a-uuid"
    }
  }'

# Confirm payment
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "confirmPayment",
    "data": {
      "settlementId": "settlement-uuid",
      "paymentReference": "BANK-REF-123"
    }
  }'

# Supplier ships
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "markShipped",
    "data": {
      "settlementId": "settlement-uuid",
      "trackingNumber": "COURIER-456"
    }
  }'

# Villages confirm receipt
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "confirmReceipt",
    "data": { "settlementId": "settlement-uuid" }
  }'
```

### Step 9: Record for Intelligence

```bash
curl -X POST http://localhost:3000/api/cpme \
  -H "Content-Type: application/json" \
  -d '{
    "action": "recordTransaction",
    "data": {
      "category": "agriculture",
      "product": "Maize Seeds",
      "region": "Limpopo",
      "quantity": 600,
      "price": 380,
      "villageCount": 3,
      "savingsPercent": 24
    }
  }'
```

---

## Fee Calculation Example

For a R228,000 seed order (600 bags × R380):

- **Total Value**: R228,000
- **Coordination Fee** (0.5%): R1,140
- **Village Savings**: R72,000 (vs R500/bag retail)

```sql
-- Fee calculation in contract
coordination_fee = (total_value * coordination_fee_percent) / 1000
                 = (228000 * 50) / 1000
                 = R11,400  -- 5% (as defined in schema)

-- Net to supplier
net_value = total_value - coordination_fee
          = 228000 - 11400
          = R216,600
```

---

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Circle at maximum capacity` | `maxVillages` limit reached | Create new circle or increase limit |
| `Demand not found` | Invalid demand ID | Verify UUID exists in database |
| `Supplier not verified` | Supplier status not `verified` | Run verifySupplier action |
| `Contract not signed` | Missing approval vote | Complete governance approval |

### Viewing Data

```sql
-- Check all demands
SELECT * FROM village_demands;

-- Check circle status
SELECT * FROM procurement_circles;

-- View contracts
SELECT c.*, s.name as supplier_name 
FROM contracts c 
JOIN suppliers s ON c.supplier_id = s.id;

-- Settlement pipeline
SELECT * FROM order_settlements 
WHERE status NOT IN ('confirmed', 'refunded');
```
