"""
Validation Test Script
=======================
Runs the full detection engine pipeline against the test CSV data and
verifies that the two injected disruptions are correctly detected:

  ✓  SUP-002 / MED-002  →  scope: systemic,  diagnosis: supplier_delay
  ✓  FAC-003 / MED-001  →  scope: local,     diagnosis: demand_spike

Prints formatted output for demo / judge review.
"""

import sys
import json

# ── Load engine modules ─────────────────────────────────────────────────
from data_loader import DataLoader
from risk_scorer import compute_risk_scores
from alert_detector import detect_alerts
from recommender import generate_recommendations


def hr(char="─", width=80):
    print(char * width)


def section(title):
    print()
    hr("═")
    print(f"  {title}")
    hr("═")


def print_risk_scores(scores):
    """Print risk scores in a readable table."""
    section("RISK SCORES")
    # Group by risk level for clarity
    for level in ["red", "amber", "green"]:
        level_scores = [s for s in scores if s["risk_level"] == level]
        if not level_scores:
            continue
        print(f"\n  ── {level.upper()} ({len(level_scores)}) ──")
        for s in level_scores:
            sig = s["signals"]
            print(
                f"  {s['facility_id']:>8} / {s['medicine_id']:>8}  "
                f"│ DoS: {s['days_of_supply']:>6.1f}  "
                f"│ Repl: {sig['replenishment_status']:>8} ({sig['replenishment_delay_days']:+d}d)  "
                f"│ Anomaly: {sig['consumption_anomaly_score']:>+5.1f} ({sig['consumption_trend']})  "
                f"│ Conf: {s['confidence']}"
            )
            if s["reason_codes"]:
                for rc in s["reason_codes"]:
                    print(f"           ↳ {rc}")


def print_alerts(alerts):
    """Print alerts with full detail."""
    section("ALERTS")
    for a in alerts:
        print(f"\n  📋 {a['alert_id']}  [{a['scope'].upper()}]  {a['diagnosis']}")
        print(f"     Medicine  : {a['medicine_id']}")
        print(f"     Supplier  : {a['supplier_id']}")
        print(f"     District  : {a['district']}")
        print(f"     Affected  : {', '.join(a['affected_facilities'])} "
              f"({a['pct_facilities_amber_or_red']}%)")
        print(f"     Summary   : {a['summary']}")


def print_recommendations(recs):
    """Print recommendations sorted by priority."""
    section("RECOMMENDATIONS (sorted by priority)")
    for r in recs:
        emoji = {"escalate": "🔺", "redistribution": "🔄", "expedite": "⚡"}.get(
            r["type"], "•"
        )
        print(f"\n  {emoji} {r['recommendation_id']}  [{r['type'].upper()}]  "
              f"Priority: {r['priority_score']}")
        print(f"     Medicine : {r['medicine_id']}")
        if r["from_facility_id"]:
            print(f"     From     : {r['from_facility_id']}")
        print(f"     To       : {r['to_facility_id']}")
        if r["suggested_quantity"]:
            print(f"     Qty      : {r['suggested_quantity']} units")
        if r["travel_time_minutes"]:
            print(f"     Travel   : {r['travel_time_minutes']} min")
        print(f"     Reason   : {r['priority_reason']}")


def run_validation(scores, alerts, recs):
    """
    Check that both injected disruptions are correctly classified.
    Returns True if all checks pass.
    """
    section("VALIDATION")
    all_pass = True

    # ── Check 1: Systemic supplier delay for SUP-002 / MED-002 ──
    print("\n  Test 1: SUP-002 supplier-wide delay for MED-002")
    print("  Expected: scope=systemic, diagnosis=supplier_delay")

    systemic_alerts = [
        a for a in alerts
        if a["scope"] == "systemic"
        and a["medicine_id"] == "MED-002"
        and a["diagnosis"] == "supplier_delay"
    ]

    if systemic_alerts:
        a = systemic_alerts[0]
        sup002_facs = {"FAC-003", "FAC-004", "FAC-005"}
        affected = set(a["affected_facilities"])
        overlap = affected & sup002_facs

        if len(overlap) >= 2:
            print(f"  ✅ PASS — detected systemic/supplier_delay")
            print(f"     Alert {a['alert_id']}: {a['affected_facilities']}")
            print(f"     {a['summary']}")
        else:
            print(f"  ⚠️  PARTIAL — systemic alert found but only covers: {a['affected_facilities']}")
            all_pass = False
    else:
        print("  ❌ FAIL — no systemic/supplier_delay alert found for MED-002")
        all_pass = False

    # ── Check 2: Local demand spike at FAC-003 / MED-001 ──
    print("\n  Test 2: FAC-003 local consumption spike for MED-001")
    print("  Expected: scope=local, diagnosis=demand_spike")

    local_alerts = [
        a for a in alerts
        if a["scope"] == "local"
        and "FAC-003" in a["affected_facilities"]
        and a["medicine_id"] == "MED-001"
        and a["diagnosis"] == "demand_spike"
    ]

    if local_alerts:
        a = local_alerts[0]
        print(f"  ✅ PASS — detected local/demand_spike")
        print(f"     Alert {a['alert_id']}: {a['affected_facilities']}")
        print(f"     {a['summary']}")
    else:
        # Check if it was detected but with wrong diagnosis
        any_fac003_med001 = [
            a for a in alerts
            if "FAC-003" in a["affected_facilities"]
            and a["medicine_id"] == "MED-001"
        ]
        if any_fac003_med001:
            a = any_fac003_med001[0]
            print(f"  ⚠️  PARTIAL — FAC-003/MED-001 alert found but diagnosed as "
                  f"{a['scope']}/{a['diagnosis']}")
            all_pass = False
        else:
            print("  ❌ FAIL — no alert found for FAC-003/MED-001")
            all_pass = False

    # ── Check 3: Different diagnosis types ──
    print("\n  Test 3: The two disruptions must have DIFFERENT diagnosis types")

    if systemic_alerts and local_alerts:
        diag1 = systemic_alerts[0]["diagnosis"]
        diag2 = local_alerts[0]["diagnosis"]
        if diag1 != diag2:
            print(f"  ✅ PASS — '{diag1}' ≠ '{diag2}'")
        else:
            print(f"  ❌ FAIL — both diagnosed as '{diag1}'")
            all_pass = False
    else:
        print("  ❌ FAIL — cannot compare (one or both alerts missing)")
        all_pass = False

    # ── Check 4: Systemic alerts get 'escalate', local gets 'redistribution' ──
    print("\n  Test 4: Recommendation types match alert scopes")

    escalate_recs = [r for r in recs if r["type"] == "escalate"]
    redist_recs = [r for r in recs if r["type"] == "redistribution"]

    if escalate_recs:
        print(f"  ✅ Found {len(escalate_recs)} escalation(s) for systemic alerts")
    else:
        print("  ⚠️  No escalation recommendations found")

    if redist_recs:
        print(f"  ✅ Found {len(redist_recs)} redistribution(s) for local alerts")
    else:
        print("  ⚠️  No redistribution recommendations found")

    return all_pass


def main():
    print()
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║   MEDICINE SHORTAGE DETECTION ENGINE — VALIDATION SUITE    ║")
    print("╚══════════════════════════════════════════════════════════════╝")

    # ── Load data (CSV fallback mode — teammate API not needed) ──
    print("\n  Loading test data...")
    loader = DataLoader(csv_dir="test_data")
    data = loader.load_all()

    for name, df in data.items():
        print(f"    {name:>15}: {len(df):>5} rows")

    # ── Run pipeline ──
    print("\n  Running detection engine...")
    risk_scores = compute_risk_scores(data)
    alerts = detect_alerts(data, risk_scores)
    recommendations = generate_recommendations(data, risk_scores, alerts)

    print(f"    Risk scores     : {len(risk_scores)}")
    print(f"    Alerts          : {len(alerts)}")
    print(f"    Recommendations : {len(recommendations)}")

    # ── Print results ──
    print_risk_scores(risk_scores)
    print_alerts(alerts)
    print_recommendations(recommendations)

    # ── Run validation checks ──
    passed = run_validation(risk_scores, alerts, recommendations)

    # ── Summary ──
    section("RESULT")
    if passed:
        print("\n  🎉 ALL VALIDATION CHECKS PASSED")
        print("  The engine correctly distinguishes systemic supplier delays")
        print("  from local demand spikes with different diagnosis types.")
        print()
        sys.exit(0)
    else:
        print("\n  ⚠️  SOME CHECKS DID NOT PASS — review output above")
        print()
        sys.exit(1)


if __name__ == "__main__":
    main()
