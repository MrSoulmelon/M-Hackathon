"""
Medicine Shortage Detection Engine — Central Configuration
==========================================================
All scoring thresholds are defined here as named constants for transparency.
Judges (and teammates) can read this file to understand every flag.
"""

# ─── Data Source Configuration ───────────────────────────────────────────
API_BASE_URL = "http://localhost:8000"
CSV_DATA_DIR = "test_data"          # Fallback directory for CSV files

# ─── Risk Scoring — Days of Supply ──────────────────────────────────────
# days_of_supply = current_stock / avg_daily_consumption
DOS_RED_CRITICAL = 3        # RED unconditionally (≤3 days = emergency)
DOS_RED_THRESHOLD = 5       # RED if combined with another red signal
DOS_AMBER_THRESHOLD = 14    # AMBER if below 14 days of supply

# ─── Risk Scoring — Consumption Analysis ────────────────────────────────
CONSUMPTION_RECENT_WINDOW = 7       # Days in the "recent" window for averaging
CONSUMPTION_TREND_WINDOW = 30       # Days in the "historical trend" baseline
CONSUMPTION_MIN_DAYS = 7            # Minimum days to compute a meaningful score

ANOMALY_RED_THRESHOLD = 2.0         # Z-score ≥ 2.0 → red flag
ANOMALY_AMBER_THRESHOLD = 1.5      # Z-score ≥ 1.5 → amber flag
TREND_RISING_THRESHOLD = 0.5       # Z > 0.5 → "rising" label
TREND_FALLING_THRESHOLD = -0.5     # Z < -0.5 → "falling" label

# ─── Risk Scoring — Replenishment ───────────────────────────────────────
REPLENISHMENT_OVERDUE_DAYS = 7      # >7 days past expected_date → overdue (red)
REPLENISHMENT_DELAYED_DAYS = 3      # >3 days past expected_date → delayed (amber)

# ─── Confidence Levels ──────────────────────────────────────────────────
# Based on how many days of clean (non-null) history exist
CONFIDENCE_HIGH_DAYS = 14           # ≥14 days → high confidence
CONFIDENCE_MEDIUM_DAYS = 7          # 7-13 days → medium confidence
                                    # <7 days → low confidence

# ─── Alert Detection ────────────────────────────────────────────────────
SYSTEMIC_FACILITY_PCT = 0.50        # >50% of supplier's facilities at risk → systemic
DELAY_CORRELATION_WINDOW_DAYS = 5   # Delays within 5 days of each other → correlated
MIN_FACILITIES_FOR_SYSTEMIC = 2     # Need at least 2 facilities to call it systemic

# ─── Recommendation Engine ──────────────────────────────────────────────
# Criticality tier weights (tier 1 or 'essential' = most critical)
CRITICALITY_WEIGHTS = {
    "essential": 3.0, 
    "routine": 1.0, 
    1: 3.0, 
    2: 2.0, 
    3: 1.0
}

TRAVEL_SPEED_KMH = 40              # Assumed road speed for travel-time estimates
NEIGHBOR_SURPLUS_DOS_MIN = 20      # Donor must have ≥20 days of supply to donate
DAYS_OF_SUPPLY_TARGET = 14         # Target days of supply after redistribution
