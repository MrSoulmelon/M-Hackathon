"""
Test Data Generator
====================
Creates synthetic but realistic CSV files with TWO injected disruptions:

  1. SUPPLIER-WIDE DELAY  (SUP-002 / MED-002):
     All three SUP-002 facilities (FAC-003, FAC-004, FAC-005) have a
     replenishment for Amoxicillin (MED-002, criticality tier 1) that was
     expected 10 days ago but has NOT arrived.  Stock is declining toward
     zero.  → should trigger a SYSTEMIC / supplier_delay alert.

  2. LOCAL CONSUMPTION SPIKE  (FAC-003 / MED-001):
     Facility FAC-003 experienced a sudden 3× consumption increase for
     Paracetamol (MED-001) over the last 7 days, independent of any
     supply-chain issue.  → should trigger a LOCAL / demand_spike alert.

Run this script to regenerate the test_data/ CSVs.
"""

import os
import json
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

random.seed(42)
np.random.seed(42)

OUT_DIR = os.path.join(os.path.dirname(__file__), "test_data")
os.makedirs(OUT_DIR, exist_ok=True)

# Reference date (today)
TODAY = datetime(2026, 9, 11)
DAYS = 30  # 30 days of history
START_DATE = TODAY - timedelta(days=DAYS - 1)


# ═══════════════════════════════════════════════════════════════════════
#  1. FACILITIES
# ═══════════════════════════════════════════════════════════════════════
facilities = [
    {
        "facility_id": "FAC-001",
        "name": "City General Hospital",
        "district": "District-North",
        "lat": 28.6139,
        "lon": 77.2090,
        "type": "hospital",
        "catchment_population": 50000,
        "supplier_id": "SUP-001",
        "neighbors": json.dumps(["FAC-002", "FAC-003"]),
    },
    {
        "facility_id": "FAC-002",
        "name": "Northside Clinic",
        "district": "District-North",
        "lat": 28.6300,
        "lon": 77.2200,
        "type": "clinic",
        "catchment_population": 20000,
        "supplier_id": "SUP-001",
        "neighbors": json.dumps(["FAC-001", "FAC-003"]),
    },
    {
        "facility_id": "FAC-003",
        "name": "Central Health Centre",
        "district": "District-North",
        "lat": 28.6450,
        "lon": 77.2350,
        "type": "hospital",
        "catchment_population": 45000,
        "supplier_id": "SUP-002",
        "neighbors": json.dumps(["FAC-001", "FAC-002"]),
    },
    {
        "facility_id": "FAC-004",
        "name": "Southgate Clinic",
        "district": "District-South",
        "lat": 28.5200,
        "lon": 77.1900,
        "type": "clinic",
        "catchment_population": 30000,
        "supplier_id": "SUP-002",
        "neighbors": json.dumps(["FAC-005", "FAC-006"]),
    },
    {
        "facility_id": "FAC-005",
        "name": "District South Hospital",
        "district": "District-South",
        "lat": 28.5000,
        "lon": 77.1700,
        "type": "hospital",
        "catchment_population": 55000,
        "supplier_id": "SUP-002",
        "neighbors": json.dumps(["FAC-004", "FAC-006"]),
    },
    {
        "facility_id": "FAC-006",
        "name": "Riverside Clinic",
        "district": "District-South",
        "lat": 28.5100,
        "lon": 77.2100,
        "type": "clinic",
        "catchment_population": 25000,
        "supplier_id": "SUP-001",
        "neighbors": json.dumps(["FAC-004", "FAC-005"]),
    },
]

# ═══════════════════════════════════════════════════════════════════════
#  2. SUPPLIES (medicines)
# ═══════════════════════════════════════════════════════════════════════
supplies = [
    {
        "medicine_id": "MED-001",
        "name": "Paracetamol 500mg",
        "unit": "tablets",
        "criticality_tier": 2,
    },
    {
        "medicine_id": "MED-002",
        "name": "Amoxicillin 250mg",
        "unit": "capsules",
        "criticality_tier": 1,  # Most critical
    },
    {
        "medicine_id": "MED-003",
        "name": "ORS Sachets",
        "unit": "sachets",
        "criticality_tier": 3,
    },
]

# ═══════════════════════════════════════════════════════════════════════
#  3. CONSUMPTION  (daily dispensing records)
# ═══════════════════════════════════════════════════════════════════════
consumption_rows = []
dates = [START_DATE + timedelta(days=d) for d in range(DAYS)]

# Base daily consumption rates per medicine (mean, std)
BASE_RATES = {
    "MED-001": (15, 3),   # ~15 tablets/day
    "MED-002": (12, 2),   # ~12 capsules/day
    "MED-003": (8, 2),    # ~8 sachets/day
}

for fac in facilities:
    fid = fac["facility_id"]
    for med_id, (mean, std) in BASE_RATES.items():
        for i, date in enumerate(dates):
            qty = max(1, int(np.random.normal(mean, std)))

            # ── DISRUPTION 2: FAC-003 / MED-001 consumption spike ──
            # Last 7 days: consumption triples (simulating a local outbreak)
            if fid == "FAC-003" and med_id == "MED-001" and i >= DAYS - 7:
                qty = max(10, int(np.random.normal(mean * 3, std * 2)))

            consumption_rows.append(
                {
                    "facility_id": fid,
                    "medicine_id": med_id,
                    "date": date.strftime("%Y-%m-%d"),
                    "quantity_dispensed": qty,
                }
            )

# ═══════════════════════════════════════════════════════════════════════
#  4. INVENTORY  (daily stock snapshots)
# ═══════════════════════════════════════════════════════════════════════
inventory_rows = []

# Build consumption lookup for inventory simulation
cons_df = pd.DataFrame(consumption_rows)
cons_df["date"] = pd.to_datetime(cons_df["date"])

INITIAL_STOCK = {
    "MED-001": 400,   # Higher so normal facilities stay green (~25+ DoS)
    "MED-002": 250,
    "MED-003": 200,
}

# Resupply amounts per medicine
RESUPPLY_QTY = {
    "MED-001": 200,   # Higher to keep MED-001 well-stocked normally
    "MED-002": 150,
    "MED-003": 150,
}

# Normal resupply: every ~10 days, receive ~150 units
# SUP-002 facilities for MED-002: NO resupply in last 15 days (the disruption)
for fac in facilities:
    fid = fac["facility_id"]
    supplier = fac["supplier_id"]

    for med_id in BASE_RATES.keys():
        stock = INITIAL_STOCK[med_id]

        for i, date in enumerate(dates):
            # Subtract daily consumption
            day_cons = cons_df[
                (cons_df["facility_id"] == fid)
                & (cons_df["medicine_id"] == med_id)
                & (cons_df["date"] == date)
            ]["quantity_dispensed"].sum()

            stock -= day_cons

            # Normal resupply (every ~10 days)
            should_resupply = (i > 0 and i % 10 == 0)

            # ── DISRUPTION 1: SUP-002 facilities get NO resupply for
            #    MED-002 in the last 15 days ──
            if (
                supplier == "SUP-002"
                and med_id == "MED-002"
                and i >= DAYS - 15
            ):
                should_resupply = False

            if should_resupply:
                stock += RESUPPLY_QTY.get(med_id, 150)

            stock = max(0, stock)  # Can't go negative

            inventory_rows.append(
                {
                    "facility_id": fid,
                    "medicine_id": med_id,
                    "date": date.strftime("%Y-%m-%d"),
                    "quantity_on_hand": stock,
                }
            )

# ═══════════════════════════════════════════════════════════════════════
#  5. REPLENISHMENT  (order records)
# ═══════════════════════════════════════════════════════════════════════
replenishment_rows = []

for fac in facilities:
    fid = fac["facility_id"]
    supplier = fac["supplier_id"]

    for med_id in BASE_RATES.keys():
        # Historical orders (completed, mostly on time)
        for order_offset in [25, 15]:
            order_date = TODAY - timedelta(days=order_offset + 3)
            expected_date = TODAY - timedelta(days=order_offset)

            # ── DISRUPTION 1: SUP-002 / MED-002 — recent order is OVERDUE ──
            if supplier == "SUP-002" and med_id == "MED-002" and order_offset == 15:
                # This order was expected 15 days ago but never arrived
                # (we'll add a more recent overdue one below instead)
                continue

            # Normal: arrived on time (±1 day)
            delay = random.choice([-1, 0, 0, 0, 1, 1, 2])
            actual_date = expected_date + timedelta(days=delay)

            replenishment_rows.append(
                {
                    "facility_id": fid,
                    "medicine_id": med_id,
                    "order_date": order_date.strftime("%Y-%m-%d"),
                    "expected_date": expected_date.strftime("%Y-%m-%d"),
                    "actual_received_date": actual_date.strftime("%Y-%m-%d"),
                    "quantity": 150,
                }
            )

        # ── DISRUPTION 1: SUP-002 / MED-002 — add an overdue order ──
        if supplier == "SUP-002" and med_id == "MED-002":
            # Order placed 14 days ago, expected 10 days ago, NOT received
            replenishment_rows.append(
                {
                    "facility_id": fid,
                    "medicine_id": med_id,
                    "order_date": (TODAY - timedelta(days=14)).strftime("%Y-%m-%d"),
                    "expected_date": (TODAY - timedelta(days=10)).strftime("%Y-%m-%d"),
                    "actual_received_date": "",  # NOT received
                    "quantity": 150,
                }
            )


# ═══════════════════════════════════════════════════════════════════════
#  WRITE CSVs
# ═══════════════════════════════════════════════════════════════════════
pd.DataFrame(facilities).to_csv(
    os.path.join(OUT_DIR, "facilities.csv"), index=False
)
pd.DataFrame(supplies).to_csv(
    os.path.join(OUT_DIR, "supplies.csv"), index=False
)
pd.DataFrame(consumption_rows).to_csv(
    os.path.join(OUT_DIR, "consumption.csv"), index=False
)
pd.DataFrame(inventory_rows).to_csv(
    os.path.join(OUT_DIR, "inventory.csv"), index=False
)
pd.DataFrame(replenishment_rows).to_csv(
    os.path.join(OUT_DIR, "replenishment.csv"), index=False
)

print(f"✓ Generated test data in {OUT_DIR}/")
print(f"  facilities.csv     : {len(facilities)} rows")
print(f"  supplies.csv       : {len(supplies)} rows")
print(f"  consumption.csv    : {len(consumption_rows)} rows")
print(f"  inventory.csv      : {len(inventory_rows)} rows")
print(f"  replenishment.csv  : {len(replenishment_rows)} rows")
print()
print("Injected disruptions:")
print("  1. SUP-002 / MED-002: overdue replenishment (10 days late, not received)")
print("     → Expected: SYSTEMIC / supplier_delay alert for FAC-003, FAC-004, FAC-005")
print("  2. FAC-003 / MED-001: 3× consumption spike in last 7 days")
print("     → Expected: LOCAL / demand_spike alert for FAC-003")
