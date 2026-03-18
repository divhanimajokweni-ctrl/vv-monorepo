"""
Lindiwe AI — The Village Elder
FastAPI service for Ubuntu Pools real-time risk evaluation and Ubuntu Score analysis.

Lindiwe monitors the Ubuntu Score and automatically recommends adjustments to
Smart Contract parameters (interest rates, pool limits) based on individual and
collective social capital.
"""

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, List
import os
import logging
from datetime import datetime, timezone
import httpx

# ── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s — %(name)s — %(levelname)s — %(message)s"
)
logger = logging.getLogger("lindiwe-ai")

# ── App Setup ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Lindiwe AI — The Village Elder",
    description=(
        "Lindiwe is the intelligence layer for Ubuntu Pools. She monitors Ubuntu Scores, "
        "evaluates social capital, and recommends Smart Contract adjustments to ensure "
        "the Village remains healthy and equitable."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Configuration ──────────────────────────────────────────────────────────
BACKBONE_URL = os.getenv("UBUNTU_BACKBONE_URL", "http://ubuntu-backbone-api.up-dev.svc.cluster.local")
BASE_RATE = float(os.getenv("BASE_INTEREST_RATE", "15.0"))   # % APR (South African market context)
MIN_RATE = float(os.getenv("MIN_INTEREST_RATE", "5.0"))      # Floor for any rate
SCORE_THRESHOLD = int(os.getenv("ADJUST_THRESHOLD", "700"))  # Score above which we adjust contracts
VILLAGE_BOOST_THRESHOLD = float(os.getenv("VILLAGE_BOOST_THRESHOLD", "0.95"))


# ── Models ─────────────────────────────────────────────────────────────────
class ScoreUpdate(BaseModel):
    user_id: str = Field(..., description="UUID of the villager")
    ubuntu_score: int = Field(..., ge=0, le=1000, description="Current Ubuntu Score (0-1000)")
    pool_id: str = Field(..., description="UUID of the Village Pool")
    pool_health_rating: Optional[float] = Field(None, ge=0.0, le=1.0,
        description="Current pool health rating from Lindiwe aggregate")


class PillarInput(BaseModel):
    on_time_payments: int = Field(..., ge=0)
    total_cycles: int = Field(..., ge=0)
    peer_assistance_count: int = Field(..., ge=0)
    avg_repayment_days: float = Field(..., ge=0)
    votes_cast: int = Field(..., ge=0)
    total_pool_votes: int = Field(..., ge=0)
    pool_health_rating: float = Field(1.0, ge=0.0, le=1.0)


class ScoreCalcRequest(BaseModel):
    user_id: str
    pillars: PillarInput


class RiskEvaluationResponse(BaseModel):
    user_id: str
    ubuntu_score: int
    recommended_rate: str
    action: str
    message: str
    breakdown: dict
    evaluated_at: str


class ScoreCalcResponse(BaseModel):
    user_id: str
    ubuntu_score: int
    pillar_scores: dict
    village_boosted: bool
    calculated_at: str


class PoolHealthRequest(BaseModel):
    pool_id: str
    member_scores: List[int] = Field(..., description="List of all member Ubuntu Scores")


class PoolHealthResponse(BaseModel):
    pool_id: str
    health_rating: float
    consistent_member_rate: float
    village_boost_active: bool
    avg_score: float
    recommendation: str


# ── Helper Functions ───────────────────────────────────────────────────────
def compute_recommended_rate(ubuntu_score: int) -> float:
    """
    Lindiwe Logic: Higher Ubuntu Score = Lower Interest Rate
    Thresholds calibrated for the South African market (SA prime rate context).
    Max discount: 10% APR reduction for a perfect score of 1000.
    """
    discount = (ubuntu_score / 1000) * 10.0
    return max(MIN_RATE, BASE_RATE - discount)


def determine_action(ubuntu_score: int) -> str:
    if ubuntu_score >= 900:
        return "ADJUST_SMART_CONTRACT"
    elif ubuntu_score >= SCORE_THRESHOLD:
        return "ADJUST_SMART_CONTRACT"
    elif ubuntu_score >= 400:
        return "MONITOR"
    else:
        return "FLAG_FOR_REVIEW"


def lindiwe_message(ubuntu_score: int) -> str:
    if ubuntu_score >= 900:
        return "The Village Elder blesses your path. You are a pillar of the community."
    elif ubuntu_score >= 700:
        return "Lindiwe sees your contribution to the village. Your rate has been adjusted."
    elif ubuntu_score >= 400:
        return "You are growing within the village. Keep contributing — the community sees you."
    else:
        return "The village welcomes you. Every contribution builds trust and opens new paths."


def calculate_ubuntu_score_from_pillars(pillars: PillarInput) -> tuple:
    """Returns (raw_score, pillar_scores_dict, village_boosted)"""
    consistency = pillars.on_time_payments / pillars.total_cycles if pillars.total_cycles > 0 else 0
    reciprocity = min(pillars.peer_assistance_count / 10, 1.0)
    utilization = max(0, 1 - (pillars.avg_repayment_days / 30))
    governance = min(pillars.votes_cast / pillars.total_pool_votes, 1.0) if pillars.total_pool_votes > 0 else 0

    raw = (consistency * 400) + (reciprocity * 300) + (utilization * 200) + (governance * 100)

    village_boosted = pillars.pool_health_rating > VILLAGE_BOOST_THRESHOLD
    if village_boosted:
        raw *= 1.05

    pillar_scores = {
        "consistency": round(consistency * 100),
        "reciprocity": round(reciprocity * 100),
        "utilization": round(utilization * 100),
        "governance": round(governance * 100),
    }

    return min(round(raw), 1000), pillar_scores, village_boosted


# ── Routes ─────────────────────────────────────────────────────────────────
@app.get("/v1/lindiwe/health", tags=["Health"])
async def health_check():
    """Liveness check — Lindiwe is always watching."""
    return {
        "status": "wise",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message": "The Village Elder is present."
    }


@app.post("/v1/lindiwe/evaluate-risk",
          response_model=RiskEvaluationResponse,
          tags=["Risk Evaluation"])
async def evaluate_risk(data: ScoreUpdate):
    """
    Core Lindiwe endpoint.
    Evaluates a villager's Ubuntu Score and returns a recommended interest rate
    and Smart Contract action.

    Called by:
    - Ubuntu Backbone (post-transaction)
    - SafeGrid Brain API (risk signal pipeline)
    """
    logger.info(f"Evaluating risk for villager {data.user_id} | Score: {data.ubuntu_score}")

    final_rate = compute_recommended_rate(data.ubuntu_score)
    action = determine_action(data.ubuntu_score)
    message = lindiwe_message(data.ubuntu_score)

    # Village Multiplier check
    pool_health = data.pool_health_rating or 1.0
    village_boosted = pool_health > VILLAGE_BOOST_THRESHOLD

    breakdown = {
        "base_rate": f"{BASE_RATE}%",
        "discount_applied": f"{BASE_RATE - final_rate:.1f}%",
        "village_boost_active": village_boosted,
        "threshold_for_adjustment": SCORE_THRESHOLD,
    }

    return RiskEvaluationResponse(
        user_id=data.user_id,
        ubuntu_score=data.ubuntu_score,
        recommended_rate=f"{final_rate:.1f}%",
        action=action,
        message=message,
        breakdown=breakdown,
        evaluated_at=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/v1/lindiwe/calculate-score",
          response_model=ScoreCalcResponse,
          tags=["Score Calculation"])
async def calculate_score(request: ScoreCalcRequest):
    """
    Compute a full Ubuntu Score from raw pillar data.
    This endpoint is called by the Supabase Edge Function cron job every 6 hours.
    """
    logger.info(f"Computing Ubuntu Score for villager {request.user_id}")

    score, pillar_scores, boosted = calculate_ubuntu_score_from_pillars(request.pillars)

    return ScoreCalcResponse(
        user_id=request.user_id,
        ubuntu_score=score,
        pillar_scores=pillar_scores,
        village_boosted=boosted,
        calculated_at=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/v1/lindiwe/pool-health",
          response_model=PoolHealthResponse,
          tags=["Pool Intelligence"])
async def evaluate_pool_health(request: PoolHealthRequest):
    """
    Evaluate the health of a Village Pool.
    Lindiwe aggregates member scores to determine pool health_rating,
    which feeds back into all member score calculations (Village Multiplier).
    """
    if not request.member_scores:
        raise HTTPException(status_code=400, detail="Pool must have at least one member score")

    avg_score = sum(request.member_scores) / len(request.member_scores)
    consistent_members = sum(1 for s in request.member_scores if s >= 400)
    consistent_rate = consistent_members / len(request.member_scores)

    # Normalise pool health: weighted by avg score and consistency rate
    health_rating = round((consistent_rate * 0.7) + ((avg_score / 1000) * 0.3), 4)
    village_boost_active = health_rating > VILLAGE_BOOST_THRESHOLD

    if health_rating > 0.95:
        recommendation = "EXCELLENT: Village Multiplier active. All members receive +5% score boost."
    elif health_rating > 0.80:
        recommendation = "GOOD: Pool is healthy. Continue current trajectory."
    elif health_rating > 0.60:
        recommendation = "MONITOR: Some members need support. Consider peer assistance initiatives."
    else:
        recommendation = "INTERVENTION: Pool health is critical. Alert pool administrators."

    logger.info(f"Pool {request.pool_id} health_rating={health_rating}")

    return PoolHealthResponse(
        pool_id=request.pool_id,
        health_rating=health_rating,
        consistent_member_rate=round(consistent_rate, 4),
        village_boost_active=village_boost_active,
        avg_score=round(avg_score, 1),
        recommendation=recommendation,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
