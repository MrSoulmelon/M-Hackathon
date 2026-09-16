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

import pandas as pd
import uvicorn
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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

    raw_risk_scores = compute_risk_scores(data)
    
    # --- DEMO OVERRIDE: User requested exactly 2 red and 3 yellow, rest green ---
    # We will enforce this on the specific facilities from the original mock data
    demo_targets = {
        ("FAC-001", "MED-001"): "red",
        ("FAC-002", "MED-001"): "red",
        ("FAC-003", "MED-001"): "amber",
        ("FAC-013", "MED-001"): "amber",
        ("FAC-009", "MED-008"): "amber"
    }
    
    risk_scores = []
    for s in raw_risk_scores:
        key = (s["facility_id"], s["medicine_id"])
        if key in demo_targets:
            # If they manually update the stock, dos goes up.
            # Only keep it red/amber if the stock is actually low (< 14 days)
            # or if it was originally calculated as red/amber
            if s["days_of_supply"] < 14 or s["risk_level"] in ["red", "amber"]:
                s["risk_level"] = demo_targets[key]
            else:
                s["risk_level"] = "green"
        else:
            s["risk_level"] = "green"
        risk_scores.append(s)
    # --------------------------------------------------------------------------

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


class ApproveBody(BaseModel):
    recommendation_id: str
    action_type: str
    medicine_name: Optional[str] = None
    from_facility_id: Optional[str] = None
    to_facility_id: Optional[str] = None
    suggested_quantity: Optional[int] = None
    medicine_id: Optional[str] = None

@app.post("/recommendations/approve")
def approve_recommendation(body: ApproveBody):
    """
    Approve a recommendation:
    1. Remove it from the in-memory recommendations list.
    2. If it's a redistribution, transfer stock between facilities
       in the in-memory inventory DataFrame so risk scores reflect reality.
    3. Recompute risk scores and regenerate remaining recommendations.
    """
    recs: list = engine_state.get("recommendations", [])

    # Find the matched recommendation for its full details
    matched = next((r for r in recs if r["recommendation_id"] == body.recommendation_id), None)

    # Remove from list regardless
    engine_state["recommendations"] = [
        r for r in recs if r["recommendation_id"] != body.recommendation_id
    ]

    # For redistributions: update in-memory inventory so the risk scores change
    if matched and matched["type"] == "redistribution":
        from_fid = matched.get("from_facility_id")
        to_fid = matched.get("to_facility_id")
        mid = matched.get("medicine_id")
        qty = matched.get("suggested_quantity") or 0

        if from_fid and to_fid and mid and qty > 0:
            inv_df = engine_state["data"]["inventory"]
            today = inv_df["date"].max()

            # Helper: get latest quantity for a facility+medicine
            def latest_qty(fid, medicine_id):
                rows = inv_df[
                    (inv_df["facility_id"] == fid) &
                    (inv_df["medicine_id"] == medicine_id) &
                    (inv_df["date"] == today)
                ]
                if rows.empty:
                    rows = inv_df[
                        (inv_df["facility_id"] == fid) &
                        (inv_df["medicine_id"] == medicine_id)
                    ].sort_values("date")
                    if rows.empty:
                        return 0
                    return int(rows.iloc[-1]["quantity_on_hand"])
                return int(rows.iloc[0]["quantity_on_hand"])

            from_qty = latest_qty(from_fid, mid)
            to_qty = latest_qty(to_fid, mid)

            actual_transfer = min(qty, from_qty)  # can't send more than available

            # Remove existing today rows and insert updated ones
            mask = (
                (inv_df["facility_id"].isin([from_fid, to_fid])) &
                (inv_df["medicine_id"] == mid) &
                (inv_df["date"] == today)
            )
            inv_df = inv_df[~mask]

            new_rows = pd.DataFrame([
                {"facility_id": from_fid, "medicine_id": mid, "date": today, "quantity_on_hand": max(0, from_qty - actual_transfer)},
                {"facility_id": to_fid,   "medicine_id": mid, "date": today, "quantity_on_hand": to_qty + actual_transfer},
            ])
            engine_state["data"]["inventory"] = pd.concat([inv_df, new_rows], ignore_index=True)

            # Recompute risk scores and re-generate remaining recommendations
            new_risk_scores = compute_risk_scores(engine_state["data"])
            engine_state["risk_scores"] = new_risk_scores
            new_recs = generate_recommendations(
                engine_state["data"],
                new_risk_scores,
                engine_state["alerts"]
            )
            # Keep only recs that haven't been approved yet (preserve dismissals)
            approved_ids = {r["recommendation_id"] for r in engine_state["recommendations"]}
            engine_state["recommendations"] = [
                r for r in new_recs if r["recommendation_id"] not in approved_ids
                # Note: REC IDs are re-generated, so after this point
                # previously approved REC-001 may reappear only if the
                # problem still exists. That's intentional — if the
                # redistribution fixed it, the risk score goes green
                # and no new rec is generated for that pair.
            ]

    return {"status": "approved", "recommendation_id": body.recommendation_id}
    
@app.post("/refresh")
def refresh_data():
    """Reload all data from backend/CSV and recompute scores."""
    loader = DataLoader()
    data = loader.load_all()

    raw_risk_scores = compute_risk_scores(data)
    
    demo_targets = {
        ("FAC-001", "MED-001"): "red",
        ("FAC-002", "MED-001"): "red",
        ("FAC-003", "MED-001"): "amber",
        ("FAC-013", "MED-001"): "amber",
        ("FAC-009", "MED-008"): "amber"
    }
    risk_scores = []
    for s in raw_risk_scores:
        key = (s["facility_id"], s["medicine_id"])
        if key in demo_targets:
            if s["days_of_supply"] < 14 or s["risk_level"] in ["red", "amber"]:
                s["risk_level"] = demo_targets[key]
            else:
                s["risk_level"] = "green"
        else:
            s["risk_level"] = "green"
        risk_scores.append(s)

    alerts = detect_alerts(data, risk_scores)
    recommendations = generate_recommendations(data, risk_scores, alerts)

    engine_state["data"] = data
    engine_state["risk_scores"] = risk_scores
    engine_state["alerts"] = alerts
    engine_state["recommendations"] = recommendations
    
    return {"status": "refreshed", "scores_count": len(risk_scores)}

# ─── Run ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
