"""
Synthetic Data Generator for Medicine Shortage Early-Warning System.

Generates:
- 20 facilities across 4 districts (5 per district) with coordinates, suppliers, catchment, and nearest neighbors.
- 8 medicines across essential and routine criticality tiers.
- 90 days of daily InventorySnapshot, ConsumptionEvent, and ReplenishmentEvent data.
- Two injected disruptions:
    a) Starting Day 60 (2026-03-01), ALL facilities under supplier 'SUP-01' receive replenishments 5-10 days late.
    b) Starting Day 70 (2026-03-11), facility 'FAC-012' suffers a 2x spike in consumption for medicine 'MED-001'.
- Exports data to CSV files in data/csv/ and SQLite database data/shortage_system.db.
"""

import json
import os
import sqlite3
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

# Set fixed seed for reproducibility while maintaining realistic variability
np.random.seed(42)

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
CSV_DIR = os.path.join(DATA_DIR, "csv")
DB_PATH = os.path.join(DATA_DIR, "shortage_system.db")

START_DATE = datetime(2026, 1, 1)
NUM_DAYS = 90
DAY_60_DATE = START_DATE + timedelta(days=59)  # 2026-03-01 (Day 60)
DAY_70_DATE = START_DATE + timedelta(days=69)  # 2026-03-11 (Day 70)

DISRUPTED_SUPPLIER = "SUP-01"
OUTBREAK_FACILITY = "FAC-012"
OUTBREAK_MEDICINE = "MED-001"


def generate_facilities():
    """Generates 20 facilities across 4 districts (5 per district)."""
    districts = {
        "Central": {
            "center": (13.005, 77.600),
            "suppliers": ["SUP-01", "SUP-02"],
            "names": [
                ("Central General Hospital", "hospital", 85000, "SUP-01"),
                ("Downtown Community Clinic", "clinic", 25000, "SUP-01"),
                ("City Center Pharmacy", "pharmacy", 12000, "SUP-02"),
                ("Metro Care Clinic", "clinic", 28000, "SUP-01"),
                ("St. Jude District Hospital", "hospital", 65000, "SUP-02"),
            ],
        },
        "North": {
            "center": (13.110, 77.615),
            "suppliers": ["SUP-01", "SUP-03"],
            "names": [
                ("Northside Medical Center", "hospital", 75000, "SUP-01"),
                ("River North Family Clinic", "clinic", 22000, "SUP-01"),
                ("Northgate Express Pharmacy", "pharmacy", 15000, "SUP-03"),
                ("Highland Valley Clinic", "clinic", 18000, "SUP-01"),
                ("North Suburban Health Post", "clinic", 14000, "SUP-03"),
            ],
        },
        "Highland": {
            "center": (13.030, 77.490),
            "suppliers": ["SUP-03", "SUP-04"],
            "names": [
                ("Westridge Memorial Hospital", "hospital", 70000, "SUP-03"),
                ("Highland Community Clinic", "clinic", 26000, "SUP-03"),  # Outbreak target
                ("Summit Pharmacy", "pharmacy", 11000, "SUP-04"),
                ("Valley View Medical Clinic", "clinic", 20000, "SUP-03"),
                ("Pinecrest Care Center", "clinic", 16000, "SUP-04"),
            ],
        },
        "South": {
            "center": (12.910, 77.620),
            "suppliers": ["SUP-04", "SUP-05"],
            "names": [
                ("Southern Regional Hospital", "hospital", 80000, "SUP-04"),
                ("Harbor Health Clinic", "clinic", 24000, "SUP-04"),
                ("Southside Community Pharmacy", "pharmacy", 13000, "SUP-05"),
                ("Bayside Urgent Clinic", "clinic", 21000, "SUP-05"),
                ("Greenfield Health Center", "clinic", 19000, "SUP-04"),
            ],
        },
    }

    facilities = []
    fac_counter = 1

    for district_name, dinfo in districts.items():
        base_lat, base_lon = dinfo["center"]
        for name, ftype, pop, supplier_id in dinfo["names"]:
            fac_id = f"FAC-{fac_counter:03d}"
            # Small realistic spatial perturbation within ~2-3 km
            lat = round(base_lat + float(np.random.normal(0, 0.015)), 6)
            lon = round(base_lon + float(np.random.normal(0, 0.015)), 6)

            facilities.append({
                "facility_id": fac_id,
                "name": name,
                "district": district_name,
                "lat": lat,
                "lon": lon,
                "type": ftype,
                "catchment_population": pop,
                "supplier_id": supplier_id,
            })
            fac_counter += 1

    # Compute 2-3 nearest neighbors based on Euclidean distance
    for f in facilities:
        other_facs = [o for o in facilities if o["facility_id"] != f["facility_id"]]
        # Sort by distance
        other_facs.sort(key=lambda o: ((o["lat"] - f["lat"])**2 + (o["lon"] - f["lon"])**2))
        # Pick 3 nearest
        neighbors = [o["facility_id"] for o in other_facs[:3]]
        f["neighbors"] = neighbors

    return facilities


def generate_supplies():
    """Generates 8 medicines across essential and routine criticality tiers."""
    return [
        {
            "medicine_id": "MED-001",
            "name": "Amoxicillin 500mg",
            "unit": "capsules",
            "criticality_tier": "essential",
        },
        {
            "medicine_id": "MED-002",
            "name": "Paracetamol 500mg",
            "unit": "tablets",
            "criticality_tier": "routine",
        },
        {
            "medicine_id": "MED-003",
            "name": "Insulin Regular 100IU/ml",
            "unit": "vials",
            "criticality_tier": "essential",
        },
        {
            "medicine_id": "MED-004",
            "name": "Oral Rehydration Salts (ORS)",
            "unit": "sachets",
            "criticality_tier": "essential",
        },
        {
            "medicine_id": "MED-005",
            "name": "Artemether/Lumefantrine 20/120mg",
            "unit": "tablets",
            "criticality_tier": "essential",
        },
        {
            "medicine_id": "MED-006",
            "name": "Salbutamol Inhaler 100mcg",
            "unit": "inhalers",
            "criticality_tier": "routine",
        },
        {
            "medicine_id": "MED-007",
            "name": "Ciprofloxacin 500mg",
            "unit": "tablets",
            "criticality_tier": "routine",
        },
        {
            "medicine_id": "MED-008",
            "name": "Ibuprofen 400mg",
            "unit": "tablets",
            "criticality_tier": "routine",
        },
    ]


def simulate_operational_data(facilities, supplies):
    """
    Simulates 90 days of daily InventorySnapshot, ConsumptionEvent, and ReplenishmentEvent.
    Injects:
      a) Day 60+ late deliveries (5-10 days late) for SUP-01 facilities.
      b) Day 70+ 2x consumption surge for FAC-012 on MED-001.
    """
    # Medicine demand factor by medicine
    med_demand_factors = {
        "MED-001": 1.2,  # High volume antibiotic
        "MED-002": 1.5,  # Very high volume analgesic
        "MED-003": 0.3,  # Critical insulin vials (lower count, high criticality)
        "MED-004": 1.0,  # Rehydration salts
        "MED-005": 0.6,  # Antimalarial
        "MED-006": 0.4,  # Inhalers
        "MED-007": 0.7,  # Antibiotic
        "MED-008": 1.1,  # NSAID
    }

    # Facility scale by type
    type_scales = {
        "hospital": 3.0,
        "clinic": 1.0,
        "pharmacy": 0.7,
    }

    inventory_records = []
    consumption_records = []
    replenishment_records = []

    # Map facilities by ID for quick lookup
    fac_map = {f["facility_id"]: f for f in facilities}

    # Simulation state per (facility, medicine)
    state = {}
    for f in facilities:
        fid = f["facility_id"]
        pop = f["catchment_population"]
        ftype = f["type"]
        supplier_id = f["supplier_id"]

        for s in supplies:
            mid = s["medicine_id"]
            base_rate = (pop / 25000.0) * type_scales[ftype] * med_demand_factors[mid] * 12.0
            daily_mean = max(3.0, base_rate)

            lead_time_mean = 4  # Standard lead time days
            reorder_threshold = int(daily_mean * lead_time_mean * 2.2)
            order_batch_size = int(daily_mean * 12)  # Approx 12 days supply

            # Initial inventory: randomized between 1.0x and 2.0x order_batch_size
            initial_stock = int(order_batch_size * np.random.uniform(1.0, 2.0))

            state[(fid, mid)] = {
                "daily_mean": daily_mean,
                "reorder_threshold": reorder_threshold,
                "order_batch_size": order_batch_size,
                "stock": initial_stock,
                "pending_orders": [],  # list of dicts: arrival_date, qty, order_rec
                "supplier_id": supplier_id,
            }

    # Run daily simulation for 90 days
    for day_idx in range(NUM_DAYS):
        curr_date = START_DATE + timedelta(days=day_idx)
        curr_date_str = curr_date.strftime("%Y-%m-%d")
        is_weekend = curr_date.weekday() >= 5

        for f in facilities:
            fid = f["facility_id"]
            supplier_id = f["supplier_id"]

            for s in supplies:
                mid = s["medicine_id"]
                st = state[(fid, mid)]

                # 1. Process arriving replenishments for today
                arrived_qty = 0
                remaining_pending = []
                for p in st["pending_orders"]:
                    if p["arrival_date"] == curr_date_str:
                        arrived_qty += p["qty"]
                        # Update record actual_received_date
                        p["order_rec"]["actual_received_date"] = curr_date_str
                    else:
                        remaining_pending.append(p)
                st["pending_orders"] = remaining_pending
                st["stock"] += arrived_qty

                # 2. Determine daily consumption
                mean_cons = st["daily_mean"]

                # Weekend factor (clinics/pharmacies slightly lower, hospitals maintain)
                if is_weekend:
                    if f["type"] == "clinic":
                        mean_cons *= 0.65
                    elif f["type"] == "pharmacy":
                        mean_cons *= 0.85
                    else:
                        mean_cons *= 0.95

                # DISRUPTION B: Single facility sudden 2x consumption spike starting Day 70
                if fid == OUTBREAK_FACILITY and mid == OUTBREAK_MEDICINE and curr_date >= DAY_70_DATE:
                    mean_cons *= 2.0

                # Sample actual consumption with Poisson variability
                raw_cons = int(np.random.poisson(max(1.0, mean_cons)))

                # Occasional baseline random shock (e.g. 1% chance of local micro-spike)
                if np.random.rand() < 0.015:
                    raw_cons = int(raw_cons * np.random.uniform(1.4, 1.8))

                # Cap consumption by stock on hand (cannot dispense what you do not have -> stockout)
                dispensed = min(st["stock"], raw_cons)
                st["stock"] -= dispensed

                # Record consumption event
                consumption_records.append({
                    "facility_id": fid,
                    "medicine_id": mid,
                    "date": curr_date_str,
                    "quantity_dispensed": dispensed,
                })

                # Record inventory snapshot at end of day
                inventory_records.append({
                    "facility_id": fid,
                    "medicine_id": mid,
                    "date": curr_date_str,
                    "quantity_on_hand": st["stock"],
                })

                # 3. Check for Replenishment Trigger
                # If stock on hand <= reorder_threshold and no order currently pending
                if st["stock"] <= st["reorder_threshold"] and len(st["pending_orders"]) == 0:
                    nominal_lead_time = int(np.random.choice([3, 4, 5]))
                    expected_date = curr_date + timedelta(days=nominal_lead_time)
                    expected_date_str = expected_date.strftime("%Y-%m-%d")

                    # Check DISRUPTION A:
                    # Starting day 60, ALL facilities under supplier 'SUP-01' receive replenishments 5-10 days late
                    if supplier_id == DISRUPTED_SUPPLIER and curr_date >= DAY_60_DATE:
                        delay_days = int(np.random.randint(5, 11))  # 5 to 10 days late
                        actual_arrival_date = expected_date + timedelta(days=delay_days)
                    else:
                        # Normal slight delivery variance (-1 to +1 day)
                        normal_drift = int(np.random.choice([-1, 0, 0, 1]))
                        actual_arrival_date = max(curr_date + timedelta(days=1), expected_date + timedelta(days=normal_drift))

                    # If actual arrival falls beyond the 90-day simulation window, it is still in transit (actual_received_date = None)
                    last_sim_date = START_DATE + timedelta(days=NUM_DAYS - 1)
                    if actual_arrival_date > last_sim_date:
                        actual_received_str = None
                        effective_arrival_str = actual_arrival_date.strftime("%Y-%m-%d")
                    else:
                        actual_received_str = actual_arrival_date.strftime("%Y-%m-%d")
                        effective_arrival_str = actual_received_str

                    # Occasional batch size variation (+/- 10%)
                    qty_variation = float(np.random.uniform(0.9, 1.1))
                    order_qty = int(st["order_batch_size"] * qty_variation)

                    if actual_received_str:
                        status = "delivered"
                    else:
                        status = "shipped"

                    order_rec = {
                        "facility_id": fid,
                        "medicine_id": mid,
                        "order_date": curr_date_str,
                        "expected_date": expected_date_str,
                        "actual_received_date": actual_received_str,
                        "quantity": order_qty,
                        "status": status,
                    }
                    replenishment_records.append(order_rec)

                    # Track in pending
                    st["pending_orders"].append({
                        "arrival_date": effective_arrival_str,
                        "qty": order_qty,
                        "order_rec": order_rec,
                    })

    return inventory_records, consumption_records, replenishment_records


def save_to_csv_and_sqlite(facilities, supplies, inventory, consumption, replenishment):
    """Exports data to CSV files and SQLite database."""
    os.makedirs(CSV_DIR, exist_ok=True)

    # 1. Prepare DataFrames
    # Convert neighbors list to JSON string for tabular storage
    facilities_csv_data = []
    for f in facilities:
        f_copy = dict(f)
        f_copy["neighbors"] = json.dumps(f["neighbors"])
        facilities_csv_data.append(f_copy)

    df_facilities = pd.DataFrame(facilities_csv_data)
    df_supplies = pd.DataFrame(supplies)
    df_inventory = pd.DataFrame(inventory)
    df_consumption = pd.DataFrame(consumption)
    df_replenishment = pd.DataFrame(replenishment)
    
    # Generate seed users
    users = []
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_pwd = pwd_context.hash("password")
    
    # Admin
    users.append({"id": "USR-001", "email": "admin@shortagewatch.com", "password_hash": hashed_pwd, "role": "admin", "reference_id": "GLOBAL"})
    # Consumers (Facility Staff) - one for each facility
    for idx, f in enumerate(facilities):
        users.append({"id": f"USR-F{idx+1:03d}", "email": f"staff@{f['facility_id'].lower()}.com", "password_hash": hashed_pwd, "role": "consumer", "reference_id": f["facility_id"]})
    # Suppliers - one for each supplier
    supplier_ids = list(set([f["supplier_id"] for f in facilities]))
    for idx, sid in enumerate(supplier_ids):
        users.append({"id": f"USR-S{idx+1:03d}", "email": f"admin@{sid.lower()}.com", "password_hash": hashed_pwd, "role": "supplier", "reference_id": sid})
    
    df_users = pd.DataFrame(users)

    # 2. Export to CSV
    df_facilities.to_csv(os.path.join(CSV_DIR, "facilities.csv"), index=False)
    df_supplies.to_csv(os.path.join(CSV_DIR, "supplies.csv"), index=False)
    df_inventory.to_csv(os.path.join(CSV_DIR, "inventory.csv"), index=False)
    df_consumption.to_csv(os.path.join(CSV_DIR, "consumption.csv"), index=False)
    df_replenishment.to_csv(os.path.join(CSV_DIR, "replenishment.csv"), index=False)
    print(f"CSVs exported to {CSV_DIR}")

    # 3. Load into SQLite
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create tables with proper types and primary/foreign keys
    cursor.execute("""
        CREATE TABLE facilities (
            facility_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            district TEXT NOT NULL,
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            type TEXT NOT NULL,
            catchment_population INTEGER NOT NULL,
            supplier_id TEXT NOT NULL,
            neighbors TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE supplies (
            medicine_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            unit TEXT NOT NULL,
            criticality_tier TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            facility_id TEXT NOT NULL,
            medicine_id TEXT NOT NULL,
            date TEXT NOT NULL,
            quantity_on_hand INTEGER NOT NULL,
            FOREIGN KEY (facility_id) REFERENCES facilities(facility_id),
            FOREIGN KEY (medicine_id) REFERENCES supplies(medicine_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE consumption (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            facility_id TEXT NOT NULL,
            medicine_id TEXT NOT NULL,
            date TEXT NOT NULL,
            quantity_dispensed INTEGER NOT NULL,
            FOREIGN KEY (facility_id) REFERENCES facilities(facility_id),
            FOREIGN KEY (medicine_id) REFERENCES supplies(medicine_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE replenishment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            facility_id TEXT NOT NULL,
            medicine_id TEXT NOT NULL,
            order_date TEXT NOT NULL,
            expected_date TEXT NOT NULL,
            actual_received_date TEXT,
            quantity INTEGER NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (facility_id) REFERENCES facilities(facility_id),
            FOREIGN KEY (medicine_id) REFERENCES supplies(medicine_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            reference_id TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE stock_updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            facility_id TEXT NOT NULL,
            medicine_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            old_qty INTEGER NOT NULL,
            new_qty INTEGER NOT NULL,
            note TEXT NOT NULL,
            source TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (facility_id) REFERENCES facilities(facility_id),
            FOREIGN KEY (medicine_id) REFERENCES supplies(medicine_id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # Create indexes for high performance API query filtering
    cursor.execute("CREATE INDEX idx_inv_fac_med_date ON inventory(facility_id, medicine_id, date)")
    cursor.execute("CREATE INDEX idx_inv_date ON inventory(date)")
    cursor.execute("CREATE INDEX idx_cons_fac_med_date ON consumption(facility_id, medicine_id, date)")
    cursor.execute("CREATE INDEX idx_cons_date ON consumption(date)")
    cursor.execute("CREATE INDEX idx_repl_fac_med_date ON replenishment(facility_id, medicine_id, order_date)")
    cursor.execute("CREATE INDEX idx_repl_order_date ON replenishment(order_date)")

    # Insert data
    df_facilities.to_sql("facilities", conn, if_exists="append", index=False)
    df_supplies.to_sql("supplies", conn, if_exists="append", index=False)
    df_inventory.to_sql("inventory", conn, if_exists="append", index=False)
    df_consumption.to_sql("consumption", conn, if_exists="append", index=False)
    df_replenishment.to_sql("replenishment", conn, if_exists="append", index=False)
    df_users.to_sql("users", conn, if_exists="append", index=False)

    conn.commit()
    conn.close()
    print(f"SQLite database created at {DB_PATH}")


def main():
    print("=== Generating Synthetic Healthcare Supply Chain Data ===")
    facilities = generate_facilities()
    print(f"Generated {len(facilities)} facilities across 4 districts.")

    supplies = generate_supplies()
    print(f"Generated {len(supplies)} medicines across criticality tiers.")

    print(f"Simulating {NUM_DAYS} days of operations...")
    inventory, consumption, replenishment = simulate_operational_data(facilities, supplies)
    print(f"Generated {len(inventory):,} inventory snapshot records.")
    print(f"Generated {len(consumption):,} consumption event records.")
    print(f"Generated {len(replenishment):,} replenishment event records.")

    save_to_csv_and_sqlite(facilities, supplies, inventory, consumption, replenishment)

    print("\n--- Disruption Scenarios Summary ---")
    print(f"Disruption A: Supplier Breakdown")
    print(f"  - Disrupted Supplier: {DISRUPTED_SUPPLIER}")
    print(f"  - Start Date: {DAY_60_DATE.strftime('%Y-%m-%d')} (Day 60)")
    print(f"  - Impact: All facilities under {DISRUPTED_SUPPLIER} experience 5-10 day delivery delays.")
    sup_facs = [f['facility_id'] for f in facilities if f['supplier_id'] == DISRUPTED_SUPPLIER]
    print(f"  - Affected Facilities: {sup_facs}")

    print(f"\nDisruption B: Local Mini-Outbreak / Demand Surge")
    print(f"  - Outbreak Facility: {OUTBREAK_FACILITY} ({[f['name'] for f in facilities if f['facility_id'] == OUTBREAK_FACILITY][0]})")
    print(f"  - Outbreak Medicine: {OUTBREAK_MEDICINE} ({[s['name'] for s in supplies if s['medicine_id'] == OUTBREAK_MEDICINE][0]})")
    print(f"  - Start Date: {DAY_70_DATE.strftime('%Y-%m-%d')} (Day 70)")
    print(f"  - Impact: 2x consumption spike with normal replenishment, causing rapid stockout.")
    print("=== Data Generation Complete ===")


if __name__ == "__main__":
    main()
