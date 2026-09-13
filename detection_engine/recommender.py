"""
Redistribution / Intervention Recommendation Engine
====================================================
For each amber/red facility:

  systemic alert → recommend ESCALATE
    (moving stock between facilities won't fix a broken supplier pipeline)

  local alert, neighbor has surplus → recommend REDISTRIBUTION
    with estimated travel time (Haversine at ~40 km/h)

  local alert, no neighbor surplus → recommend EXPEDITE
    (emergency reorder from central warehouse)

Priority score = criticality_weight × urgency_weight × population_weight
  - criticality_weight: tier 1 → 3.0, tier 2 → 2.0, tier 3 → 1.0
  - urgency_weight: 10 / max(days_of_supply, 0.5), capped at 20
  - population_weight: log₂(catchment_population / 1000 + 1)
"""

import json
import math
import pandas as pd

from config import (
    CRITICALITY_WEIGHTS,
    TRAVEL_SPEED_KMH,
    NEIGHBOR_SURPLUS_DOS_MIN,
    DAYS_OF_SUPPLY_TARGET,
)


# ─── Helpers ────────────────────────────────────────────────────────────

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres."""
    R = 6371  # Earth's mean radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))


def _travel_time_minutes(
    fac1_id: str, fac2_id: str, fac_lookup: dict
) -> float | None:
    """Estimate travel time in minutes (Haversine / assumed road speed)."""
    f1 = fac_lookup.get(fac1_id)
    f2 = fac_lookup.get(fac2_id)
    if f1 is None or f2 is None:
        return None
    dist = _haversine_km(f1["lat"], f1["lon"], f2["lat"], f2["lon"])
    return round((dist / TRAVEL_SPEED_KMH) * 60, 1)


def _priority_score(
    criticality_tier: int | str,
    days_of_supply: float,
    catchment_population: int,
) -> float:
    """
    Higher score = more urgent.
    priority = criticality × urgency × population_weight
    """
    crit = CRITICALITY_WEIGHTS.get(criticality_tier, 1.0)
    urgency = min(20.0, max(1.0, 10.0 / max(days_of_supply, 0.5)))
    pop = math.log2(catchment_population / 1000 + 1) if catchment_population > 0 else 1.0
    return round(crit * urgency * pop, 2)


# ═══════════════════════════════════════════════════════════════════════
#  PUBLIC API
# ═══════════════════════════════════════════════════════════════════════

def generate_recommendations(
    data: dict[str, pd.DataFrame],
    risk_scores: list[dict],
    alerts: list[dict],
) -> list[dict]:
    """
    Produce ranked intervention recommendations for all amber/red facilities.
    Returns a list sorted by priority_score descending.
    """
    facilities_df = data["facilities"]
    supplies_df = data["supplies"]

    # Lookups
    risk_map: dict[tuple, dict] = {
        (rs["facility_id"], rs["medicine_id"]): rs for rs in risk_scores
    }

    alert_map: dict[tuple, dict] = {}  # (facility_id, medicine_id) → alert
    for alert in alerts:
        for fid in alert["affected_facilities"]:
            alert_map[(fid, alert["medicine_id"])] = alert

    fac_lookup: dict[str, dict] = {}
    for _, f in facilities_df.iterrows():
        row = f.to_dict()
        fac_lookup[row["facility_id"]] = row

    supply_lookup: dict[str, dict] = {}
    for _, s in supplies_df.iterrows():
        row = s.to_dict()
        supply_lookup[row["medicine_id"]] = row

    recommendations: list[dict] = []
    rec_counter = 0

    for rs in risk_scores:
        if rs["risk_level"] not in ("amber", "red"):
            continue

        fid = rs["facility_id"]
        mid = rs["medicine_id"]
        fac = fac_lookup.get(fid)
        supply = supply_lookup.get(mid)
        if fac is None or supply is None:
            continue

        criticality = supply.get("criticality_tier", 2)
        catchment = int(fac.get("catchment_population", 1000))
        priority = _priority_score(criticality, rs["days_of_supply"], catchment)

        alert = alert_map.get((fid, mid))
        is_systemic = alert is not None and alert["scope"] == "systemic"

        rec_counter += 1

        if is_systemic:
            # ── Escalate: don't shuffle stock when the pipeline is broken ──
            recommendations.append(
                {
                    "recommendation_id": f"REC-{rec_counter:03d}",
                    "type": "escalate",
                    "medicine_id": mid,
                    "from_facility_id": None,
                    "to_facility_id": fid,
                    "suggested_quantity": None,
                    "travel_time_minutes": None,
                    "priority_score": priority,
                    "priority_reason": (
                        f"Systemic supply disruption for {mid} "
                        f"(criticality tier {criticality}). "
                        f"Redistribution not viable — escalate to "
                        f"supplier / central authority."
                    ),
                }
            )
            continue

        # ── Local: try redistribution from a neighbor with surplus ──
        neighbors = fac.get("neighbors", [])
        if isinstance(neighbors, str):
            neighbors = json.loads(neighbors)

        best_donor = None
        best_donor_dos = 0.0

        for nbr_id in neighbors:
            nbr_key = (nbr_id, mid)
            nbr_rs = risk_map.get(nbr_key)
            if nbr_rs is None:
                continue
            if (
                nbr_rs["risk_level"] == "green"
                and nbr_rs["days_of_supply"] >= NEIGHBOR_SURPLUS_DOS_MIN
            ):
                if nbr_rs["days_of_supply"] > best_donor_dos:
                    best_donor = nbr_id
                    best_donor_dos = nbr_rs["days_of_supply"]

        if best_donor:
            travel = _travel_time_minutes(best_donor, fid, fac_lookup)

            # Suggest quantity: bring recipient to ~14 days, take ≤ half of
            # donor's surplus above NEIGHBOR_SURPLUS_DOS_MIN
            deficit_days = max(0, DAYS_OF_SUPPLY_TARGET - rs["days_of_supply"])
            # Rough avg daily consumption ≈ 15 units (will be refined when
            # inventory data is richer)
            avg_daily_approx = 15
            needed = round(deficit_days * avg_daily_approx)
            donor_surplus = round(
                (best_donor_dos - NEIGHBOR_SURPLUS_DOS_MIN) * avg_daily_approx / 2
            )
            suggested = max(10, min(needed, donor_surplus))

            recommendations.append(
                {
                    "recommendation_id": f"REC-{rec_counter:03d}",
                    "type": "redistribution",
                    "medicine_id": mid,
                    "from_facility_id": best_donor,
                    "to_facility_id": fid,
                    "suggested_quantity": suggested,
                    "travel_time_minutes": travel,
                    "priority_score": priority,
                    "priority_reason": (
                        f"Redistribute {mid} from {best_donor} "
                        f"({best_donor_dos:.0f} days supply) to {fid} "
                        f"({rs['days_of_supply']:.0f} days supply). "
                        f"Criticality tier {criticality}, serving "
                        f"{catchment:,} people."
                    ),
                }
            )
        else:
            # ── Expedite: no neighbour has surplus ──
            recommendations.append(
                {
                    "recommendation_id": f"REC-{rec_counter:03d}",
                    "type": "expedite",
                    "medicine_id": mid,
                    "from_facility_id": None,
                    "to_facility_id": fid,
                    "suggested_quantity": None,
                    "travel_time_minutes": None,
                    "priority_score": priority,
                    "priority_reason": (
                        f"No neighbour with surplus for {mid}. "
                        f"Emergency reorder recommended for {fid} "
                        f"(criticality tier {criticality}, "
                        f"{rs['days_of_supply']:.0f} days supply)."
                    ),
                }
            )

    # Highest priority first
    recommendations.sort(key=lambda r: r["priority_score"], reverse=True)
    return recommendations
