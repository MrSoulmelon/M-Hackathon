"""
Risk Scorer — Per-facility, per-medicine risk assessment
========================================================
Computes three independent signals, then combines them via transparent,
rule-based logic into a single risk_level (green / amber / red).

Signals:
  1. days_of_supply = current_stock ÷ avg_daily_consumption (7-14 day window)
  2. replenishment_status: on_time / delayed / overdue
     - overdue = actual (or today) − expected > 7 days
     - delayed = > 3 days
     - Also computes delay relative to facility's historical average
  3. consumption_anomaly_score: z-score of recent 7-day avg vs prior trend
     - trend classified as stable / rising / falling

Combined risk_level (see compute_risk_level for full decision table):
  RED    if days_of_supply < 3  (critical — regardless of other signals)
  RED    if days_of_supply < 5  AND  (overdue OR z > 2.0)
  AMBER  if days_of_supply < 14  OR  delayed/overdue  OR  z > 1.5
  GREEN  otherwise

Confidence:
  high   = ≥14 days of clean history
  medium = 7–13 days
  low    = <7 days
"""

import numpy as np
import pandas as pd
from datetime import timedelta

from config import (
    DOS_RED_CRITICAL,
    DOS_RED_THRESHOLD,
    DOS_AMBER_THRESHOLD,
    CONSUMPTION_RECENT_WINDOW,
    CONSUMPTION_TREND_WINDOW,
    ANOMALY_RED_THRESHOLD,
    ANOMALY_AMBER_THRESHOLD,
    TREND_RISING_THRESHOLD,
    TREND_FALLING_THRESHOLD,
    REPLENISHMENT_OVERDUE_DAYS,
    REPLENISHMENT_DELAYED_DAYS,
    CONFIDENCE_HIGH_DAYS,
    CONFIDENCE_MEDIUM_DAYS,
)


# ─── Signal 1: Days of Supply ──────────────────────────────────────────

def _compute_days_of_supply(
    inventory_df: pd.DataFrame,
    consumption_df: pd.DataFrame,
    facility_id: str,
    medicine_id: str,
    as_of_date: pd.Timestamp,
) -> tuple[float, float]:
    """
    Returns (days_of_supply, avg_daily_consumption).
    days_of_supply = latest quantity_on_hand / avg daily dispensed over last 7-14 days.
    """
    # Latest stock level
    fac_inv = inventory_df[
        (inventory_df["facility_id"] == facility_id)
        & (inventory_df["medicine_id"] == medicine_id)
        & (inventory_df["date"] <= as_of_date)
    ].sort_values("date")

    if fac_inv.empty:
        return 0.0, 0.0

    current_stock = float(fac_inv.iloc[-1]["quantity_on_hand"])

    # Average daily consumption: try 14-day window, fall back to 7 if sparse
    for window in [14, CONSUMPTION_RECENT_WINDOW]:
        window_start = as_of_date - timedelta(days=window)
        fac_cons = consumption_df[
            (consumption_df["facility_id"] == facility_id)
            & (consumption_df["medicine_id"] == medicine_id)
            & (consumption_df["date"] > window_start)
            & (consumption_df["date"] <= as_of_date)
        ]
        if len(fac_cons) >= 3:  # Need at least 3 data points
            break

    if fac_cons.empty or fac_cons["quantity_dispensed"].sum() == 0:
        # No consumption recorded → effectively infinite supply
        return current_stock / 0.001, 0.0

    num_days = max((fac_cons["date"].max() - fac_cons["date"].min()).days, 1)
    avg_daily = fac_cons["quantity_dispensed"].sum() / num_days

    dos = current_stock / max(avg_daily, 0.001)
    return round(dos, 1), round(avg_daily, 2)


# ─── Signal 2: Replenishment Status ────────────────────────────────────

def _compute_replenishment_status(
    replenishment_df: pd.DataFrame,
    facility_id: str,
    medicine_id: str,
    as_of_date: pd.Timestamp,
) -> tuple[str, int, float]:
    """
    Returns (status, delay_days, historical_avg_delay).
    status ∈ {on_time, delayed, overdue, unknown}
    """
    fac_rep = replenishment_df[
        (replenishment_df["facility_id"] == facility_id)
        & (replenishment_df["medicine_id"] == medicine_id)
    ].sort_values("expected_date")

    if fac_rep.empty:
        return "unknown", 0, 0.0

    # Historical average delay (from completed orders only)
    completed = fac_rep[fac_rep["actual_received_date"].notna()]
    if not completed.empty:
        hist_delays = (
            completed["actual_received_date"] - completed["expected_date"]
        ).dt.days
        hist_avg_delay = float(hist_delays.mean())
    else:
        hist_avg_delay = 0.0

    # Most recent order
    latest = fac_rep.iloc[-1]
    expected = latest["expected_date"]

    if pd.isna(latest["actual_received_date"]):
        # Not yet received → delay = today − expected
        delay_days = (as_of_date - expected).days
    else:
        delay_days = (latest["actual_received_date"] - expected).days

    # Classify
    if delay_days > REPLENISHMENT_OVERDUE_DAYS:
        status = "overdue"
    elif delay_days > REPLENISHMENT_DELAYED_DAYS:
        status = "delayed"
    else:
        status = "on_time"

    return status, int(delay_days), round(hist_avg_delay, 1)


# ─── Signal 3: Consumption Anomaly ─────────────────────────────────────

def _compute_consumption_anomaly(
    consumption_df: pd.DataFrame,
    facility_id: str,
    medicine_id: str,
    as_of_date: pd.Timestamp,
) -> tuple[float, str]:
    """
    Returns (z_score, trend_label).
    Z-score = (recent_7d_mean − prior_trend_mean) / prior_trend_std.
    trend_label ∈ {stable, rising, falling}.
    """
    fac_cons = consumption_df[
        (consumption_df["facility_id"] == facility_id)
        & (consumption_df["medicine_id"] == medicine_id)
        & (consumption_df["date"] <= as_of_date)
    ].sort_values("date")

    if len(fac_cons) < 10:
        return 0.0, "stable"  # Insufficient data

    recent_start = as_of_date - timedelta(days=CONSUMPTION_RECENT_WINDOW)
    trend_end = recent_start - timedelta(days=1)
    trend_start = as_of_date - timedelta(days=CONSUMPTION_TREND_WINDOW)

    recent = fac_cons[fac_cons["date"] > recent_start]["quantity_dispensed"]
    trend = fac_cons[
        (fac_cons["date"] >= trend_start) & (fac_cons["date"] <= trend_end)
    ]["quantity_dispensed"]

    if trend.empty or trend.std() == 0:
        return 0.0, "stable"

    z = (recent.mean() - trend.mean()) / trend.std()
    z = round(float(z), 2)

    if z > TREND_RISING_THRESHOLD:
        label = "rising"
    elif z < TREND_FALLING_THRESHOLD:
        label = "falling"
    else:
        label = "stable"

    return z, label


# ─── Confidence ─────────────────────────────────────────────────────────

def _compute_confidence(
    consumption_df: pd.DataFrame,
    inventory_df: pd.DataFrame,
    facility_id: str,
    medicine_id: str,
) -> tuple[str, str]:
    """
    Returns (confidence_level, confidence_note).
    Based on number of days with non-null records.
    """
    cons_days = consumption_df[
        (consumption_df["facility_id"] == facility_id)
        & (consumption_df["medicine_id"] == medicine_id)
    ]["date"].nunique()

    inv_days = inventory_df[
        (inventory_df["facility_id"] == facility_id)
        & (inventory_df["medicine_id"] == medicine_id)
    ]["date"].nunique()

    clean_days = min(cons_days, inv_days)

    if clean_days >= CONFIDENCE_HIGH_DAYS:
        return "high", f"{clean_days} days of history available"
    elif clean_days >= CONFIDENCE_MEDIUM_DAYS:
        return "medium", f"Only {clean_days} days of history; scores may be less reliable"
    else:
        return "low", f"Only {clean_days} days of data; treat scores with caution"


# ─── Combined Risk Level ───────────────────────────────────────────────

def _compute_risk_level(
    dos: float,
    rep_status: str,
    rep_delay: int,
    anomaly_z: float,
) -> tuple[str, list[str]]:
    """
    Transparent, rule-based risk classification.
    Returns (risk_level, reason_codes).

    Decision table:
      RED    if dos < 3                                 → critical stock
      RED    if dos < 5 AND (overdue OR |z| > 2.0)      → low stock + supply/demand issue
      AMBER  if dos < 14 OR delayed/overdue OR |z| > 1.5 → elevated risk
      GREEN  otherwise                                   → all signals normal
    """
    reasons: list[str] = []

    # ── RED: critical stock, no matter what ──
    if dos < DOS_RED_CRITICAL:
        reasons.append(
            f"critical_stock: only {dos:.1f} days of supply (threshold <{DOS_RED_CRITICAL})"
        )
        return "red", reasons

    # ── RED: low stock + at least one compounding factor ──
    if dos < DOS_RED_THRESHOLD:
        compounding = False
        reasons.append(
            f"low_stock: {dos:.1f} days of supply (threshold <{DOS_RED_THRESHOLD})"
        )
        if rep_status == "overdue":
            reasons.append(f"replenishment_overdue: {rep_delay} days late")
            compounding = True
        if abs(anomaly_z) > ANOMALY_RED_THRESHOLD:
            reasons.append(f"consumption_anomaly: z-score={anomaly_z:.1f}")
            compounding = True
        if compounding:
            return "red", reasons
        # Low stock alone without compounding → amber
        return "amber", reasons

    # ── AMBER: any single elevated signal ──
    amber = False
    if dos < DOS_AMBER_THRESHOLD:
        reasons.append(
            f"moderate_stock: {dos:.1f} days of supply (threshold <{DOS_AMBER_THRESHOLD})"
        )
        amber = True
    if rep_status in ("delayed", "overdue"):
        reasons.append(f"replenishment_{rep_status}: {rep_delay} days late")
        amber = True
    if abs(anomaly_z) > ANOMALY_AMBER_THRESHOLD:
        reasons.append(f"consumption_anomaly: z-score={anomaly_z:.1f}")
        amber = True

    if amber:
        return "amber", reasons

    # ── GREEN ──
    reasons.append("all_signals_normal")
    return "green", reasons


# ═══════════════════════════════════════════════════════════════════════
#  PUBLIC API
# ═══════════════════════════════════════════════════════════════════════

def compute_risk_scores(
    data: dict[str, pd.DataFrame],
    as_of_date: pd.Timestamp | str | None = None,
) -> list[dict]:
    """
    Compute risk scores for every (facility_id, medicine_id) pair found
    in the inventory data.

    Parameters
    ----------
    data : dict returned by DataLoader.load_all()
    as_of_date : reference date for "today" (defaults to latest inventory date)

    Returns
    -------
    List of dicts, each matching the output spec exactly.
    """
    inventory_df = data["inventory"]
    consumption_df = data["consumption"]
    replenishment_df = data["replenishment"]

    if as_of_date is None:
        as_of_date = inventory_df["date"].max()
    if isinstance(as_of_date, str):
        as_of_date = pd.Timestamp(as_of_date)

    # All unique (facility, medicine) pairs
    pairs = inventory_df[["facility_id", "medicine_id"]].drop_duplicates()

    results: list[dict] = []

    for _, row in pairs.iterrows():
        fid = row["facility_id"]
        mid = row["medicine_id"]

        # Three signals
        dos, avg_daily = _compute_days_of_supply(
            inventory_df, consumption_df, fid, mid, as_of_date
        )
        rep_status, rep_delay, hist_avg_delay = _compute_replenishment_status(
            replenishment_df, fid, mid, as_of_date
        )
        anomaly_z, cons_trend = _compute_consumption_anomaly(
            consumption_df, fid, mid, as_of_date
        )

        # Confidence
        confidence, confidence_note = _compute_confidence(
            consumption_df, inventory_df, fid, mid
        )

        # Combined risk level
        risk_level, reason_codes = _compute_risk_level(
            dos, rep_status, rep_delay, anomaly_z
        )

        # Projected stockout date
        if avg_daily > 0:
            projected_stockout = as_of_date + timedelta(days=max(0, dos))
            projected_stockout_str = projected_stockout.strftime("%Y-%m-%d")
        else:
            projected_stockout_str = None  # No consumption → no stockout

        results.append(
            {
                "facility_id": fid,
                "medicine_id": mid,
                "risk_level": risk_level,
                "days_of_supply": dos,
                "projected_stockout_date": projected_stockout_str,
                "confidence": confidence,
                "confidence_note": confidence_note,
                "signals": {
                    "consumption_trend": cons_trend,
                    "consumption_anomaly_score": anomaly_z,
                    "replenishment_status": rep_status,
                    "replenishment_delay_days": rep_delay,
                },
                "reason_codes": reason_codes,
            }
        )

    return results
