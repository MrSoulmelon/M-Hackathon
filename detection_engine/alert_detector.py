"""
Alert Detector — Systemic vs. local supply-chain alerts
========================================================
Groups facilities by supplier_id (and district). For each
(supplier_id, medicine_id) group:

  systemic  — if >50% of the supplier's facilities are amber/red AND
               their replenishment delays are temporally correlated
               (within 5 days of each other) → diagnosis: supplier_delay

  local     — an isolated facility flagged amber/red that is NOT part of
               a systemic cluster. If consumption anomaly is the main
               driver → diagnosis: demand_spike

  mixed     — elements of both

Each alert includes a plain-English summary sentence for the dashboard.
"""

import pandas as pd

from config import (
    SYSTEMIC_FACILITY_PCT,
    DELAY_CORRELATION_WINDOW_DAYS,
    MIN_FACILITIES_FOR_SYSTEMIC,
)


def detect_alerts(
    data: dict[str, pd.DataFrame],
    risk_scores: list[dict],
) -> list[dict]:
    """
    Analyse risk scores and replenishment data to detect alerts.
    Returns a list of alert dicts matching the output spec.
    """
    facilities_df = data["facilities"]

    # Index: (facility_id, medicine_id) → risk score dict
    risk_map: dict[tuple, dict] = {}
    for rs in risk_scores:
        risk_map[(rs["facility_id"], rs["medicine_id"])] = rs

    all_medicines = {rs["medicine_id"] for rs in risk_scores}
    all_suppliers = facilities_df["supplier_id"].unique()

    alerts: list[dict] = []
    alert_counter = 0

    # Track which (facility, medicine) pairs are covered by systemic alerts
    systemic_pairs: set[tuple] = set()

    # ── 1. Supplier-level (systemic) scan ───────────────────────────
    for supplier_id in all_suppliers:
        supplier_facs = facilities_df[
            facilities_df["supplier_id"] == supplier_id
        ]["facility_id"].tolist()

        for medicine_id in all_medicines:
            # Collect risk scores for this supplier + medicine
            at_risk: list[dict] = []
            total = 0
            for fid in supplier_facs:
                key = (fid, medicine_id)
                if key in risk_map:
                    total += 1
                    rs = risk_map[key]
                    if rs["risk_level"] in ("amber", "red"):
                        at_risk.append(rs)

            if total == 0:
                continue

            pct = len(at_risk) / total

            if (
                pct >= SYSTEMIC_FACILITY_PCT
                and len(at_risk) >= MIN_FACILITIES_FOR_SYSTEMIC
            ):
                # Check temporal correlation of delays
                delay_values = [
                    rs["signals"]["replenishment_delay_days"]
                    for rs in at_risk
                    if rs["signals"]["replenishment_delay_days"] > 0
                ]

                delays_correlated = False
                if len(delay_values) >= 2:
                    delay_range = max(delay_values) - min(delay_values)
                    delays_correlated = (
                        delay_range <= DELAY_CORRELATION_WINDOW_DAYS
                    )

                # Check for consumption anomalies
                has_anomalies = any(
                    abs(rs["signals"]["consumption_anomaly_score"]) > 1.5
                    for rs in at_risk
                )

                # Guard: require at least one real signal (delays or anomalies)
                # to call it systemic. Merely being amber from low stock
                # across facilities is not a systemic supply chain event.
                if not delays_correlated and not has_anomalies:
                    continue  # Skip — no systemic driver detected

                # Classify diagnosis
                if delays_correlated and len(delay_values) >= 2:
                    diagnosis = "supplier_delay"
                elif has_anomalies and not delays_correlated:
                    diagnosis = "demand_spike"
                else:
                    diagnosis = "mixed"

                affected_facs = [rs["facility_id"] for rs in at_risk]
                districts = (
                    facilities_df[facilities_df["facility_id"].isin(affected_facs)]
                    ["district"]
                    .unique()
                    .tolist()
                )

                alert_counter += 1
                alerts.append(
                    {
                        "alert_id": f"ALT-{alert_counter:03d}",
                        "scope": "systemic",
                        "district": (
                            districts[0]
                            if len(districts) == 1
                            else ", ".join(districts)
                        ),
                        "supplier_id": supplier_id,
                        "medicine_id": medicine_id,
                        "affected_facilities": affected_facs,
                        "pct_facilities_amber_or_red": round(pct * 100, 1),
                        "diagnosis": diagnosis,
                        "summary": _build_summary(
                            "systemic",
                            diagnosis,
                            medicine_id,
                            supplier_id,
                            affected_facs,
                            pct,
                        ),
                    }
                )

                # Mark these pairs as covered
                for fid in affected_facs:
                    systemic_pairs.add((fid, medicine_id))

    # ── 2. Local (isolated) alerts — grouped by facility ───────────────
    # Collect all uncovered amber/red (facility, medicine) pairs per facility
    local_by_facility: dict[str, list[dict]] = {}
    for rs in risk_scores:
        if rs["risk_level"] not in ("amber", "red"):
            continue
        key = (rs["facility_id"], rs["medicine_id"])
        if key in systemic_pairs:
            continue  # Already part of a systemic alert
        fid = rs["facility_id"]
        local_by_facility.setdefault(fid, []).append(rs)

    for fid, affected_scores in local_by_facility.items():
        fac_row = facilities_df[facilities_df["facility_id"] == fid]
        if fac_row.empty:
            continue

        district = fac_row.iloc[0]["district"]
        supplier = fac_row.iloc[0]["supplier_id"]

        # Sort by worst risk first, then fewest days of supply
        affected_scores.sort(key=lambda r: (0 if r["risk_level"] == "red" else 1, r["days_of_supply"]))

        # Pick the worst medicine as the "headline" medicine
        worst = affected_scores[0]
        medicine_ids = [r["medicine_id"] for r in affected_scores]

        # Diagnose based on the worst offender
        if abs(worst["signals"]["consumption_anomaly_score"]) > 1.5:
            diagnosis = "demand_spike"
        elif worst["signals"]["replenishment_status"] in ("delayed", "overdue"):
            diagnosis = "supplier_delay"
        else:
            diagnosis = "mixed"

        n_meds = len(medicine_ids)
        med_label = worst["medicine_id"] if n_meds == 1 else f"{worst['medicine_id']} +{n_meds - 1} more"

        alert_counter += 1
        alerts.append(
            {
                "alert_id": f"ALT-{alert_counter:03d}",
                "scope": "local",
                "district": district,
                "supplier_id": supplier,
                "medicine_id": worst["medicine_id"],
                "medicine_ids": medicine_ids,
                "affected_facilities": [fid],
                "pct_facilities_amber_or_red": 100.0,
                "diagnosis": diagnosis,
                "summary": _build_summary(
                    "local",
                    diagnosis,
                    med_label,
                    supplier,
                    [fid],
                    1.0,
                ),
            }
        )

    return alerts


def _build_summary(
    scope: str,
    diagnosis: str,
    medicine_id: str,
    supplier_id: str,
    affected: list[str],
    pct: float,
) -> str:
    """Generate a plain-English summary sentence for judges / dashboard."""
    n = len(affected)
    pct_display = round(pct * 100) if pct <= 1.0 else round(pct)

    if scope == "systemic" and diagnosis == "supplier_delay":
        return (
            f"Systemic supply disruption: {n} facilities supplied by "
            f"{supplier_id} are experiencing correlated replenishment delays "
            f"for {medicine_id} ({pct_display}% at risk). This pattern "
            f"indicates a supplier-level issue rather than local demand changes."
        )

    if scope == "local" and diagnosis == "demand_spike":
        return (
            f"Local demand spike at {affected[0]} for {medicine_id}. "
            f"Consumption has risen significantly above the historical trend, "
            f"risking faster-than-expected stock depletion."
        )

    if diagnosis == "mixed":
        kind = "Systemic" if scope == "systemic" else "Local"
        return (
            f"{kind} alert for {medicine_id} affecting {n} facility(ies): "
            f"mixed signals from both supply delays and demand changes."
        )

    # Fallback
    kind = "Systemic" if scope == "systemic" else "Local"
    return (
        f"{kind} {diagnosis.replace('_', ' ')} alert for {medicine_id} "
        f"affecting {n} facility(ies) under {supplier_id}."
    )
