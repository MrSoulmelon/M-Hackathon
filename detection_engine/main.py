"""
Medicine Shortage Detection Engine — FastAPI Server
====================================================
Runs on localhost:8001 with CORS enabled for all origins.

Endpoints:
  GET /risk-scores?district=&medicine_id=   (optional filters)
  GET /alerts
  GET /recommendations
  GET /health

On startup the engine loads data (API or CSV fallback), runs all three
analysis stages, and caches the results in memory.
"""

from contextlib import asynccontextmanager
from typing import Optional

import uvicorn
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from data_loader import DataLoader
from risk_scorer import compute_risk_scores
from alert_detector import detect_alerts
from recommender import generate_recommendations

# ─── Application state (populated on startup) ──────────────────────────
engine_state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load data and run the detection engine on startup."""
    loader = DataLoader()
    data = loader.load_all()

    risk_scores = compute_risk_scores(data)
    alerts = detect_alerts(data, risk_scores)
    recommendations = generate_recommendations(data, risk_scores, alerts)

    engine_state["data"] = data
    engine_state["risk_scores"] = risk_scores
    engine_state["alerts"] = alerts
    engine_state["recommendations"] = recommendations

    print(
        f"[Engine] Ready — "
        f"{len(risk_scores)} risk scores, "
        f"{len(alerts)} alerts, "
        f"{len(recommendations)} recommendations"
    )
    yield  # application runs
    engine_state.clear()


app = FastAPI(
    title="Medicine Shortage Detection Engine",
    description=(
        "Risk scoring, systemic alert detection, and redistribution "
        "recommendations for the medicine supply chain."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Endpoints ──────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "risk_scores_count": len(engine_state.get("risk_scores", [])),
        "alerts_count": len(engine_state.get("alerts", [])),
        "recommendations_count": len(engine_state.get("recommendations", [])),
    }


@app.get("/risk-scores")
def get_risk_scores(
    district: Optional[str] = Query(None, description="Filter by district name"),
    medicine_id: Optional[str] = Query(None, description="Filter by medicine ID"),
):
    scores = engine_state.get("risk_scores", [])

    if district:
        fac_df = engine_state["data"]["facilities"]
        district_facs = set(
            fac_df[fac_df["district"] == district]["facility_id"]
        )
        scores = [s for s in scores if s["facility_id"] in district_facs]

    if medicine_id:
        scores = [s for s in scores if s["medicine_id"] == medicine_id]

    return scores


@app.get("/alerts")
def get_alerts():
    return engine_state.get("alerts", [])


@app.get("/recommendations")
def get_recommendations():
    return engine_state.get("recommendations", [])


# ─── Run ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
