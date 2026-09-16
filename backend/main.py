"""
Medicine Shortage Early-Warning System - FastAPI REST Service.

Endpoints:
- GET /health
- GET /facilities
- GET /supplies
- GET /inventory?facility_id=&medicine_id=&from=&to=
- GET /consumption?facility_id=&medicine_id=&from=&to=
- GET /replenishment?facility_id=&medicine_id=&from=&to=
"""

import json
import os
import sqlite3
from typing import List, Optional
from fastapi import FastAPI, Query, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from auth import auth_router, get_current_user
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "shortage_system.db")

app = FastAPI(
    title="Medicine Shortage Early-Warning API",
    description="Backend data API providing facility metadata, supplies catalog, inventory snapshots, consumption events, and replenishment orders.",
    version="1.0.0",
)

app.include_router(auth_router)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db_connection():
    """Returns a SQLite connection with Row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# Pydantic Schemas matching exact API contract
class Facility(BaseModel):
    facility_id: str
    name: str
    district: str
    lat: float
    lon: float
    type: str
    catchment_population: int
    supplier_id: str
    neighbors: List[str]


class Supply(BaseModel):
    medicine_id: str
    name: str
    unit: str
    criticality_tier: str


class InventorySnapshot(BaseModel):
    facility_id: str
    medicine_id: str
    date: str
    quantity_on_hand: int


class ConsumptionEvent(BaseModel):
    facility_id: str
    medicine_id: str
    date: str
    quantity_dispensed: int


class ReplenishmentEvent(BaseModel):
    facility_id: str
    medicine_id: str
    order_date: str
    expected_date: str
    actual_received_date: Optional[str] = None
    quantity: int


class HealthResponse(BaseModel):
    status: str


@app.get("/health", response_model=HealthResponse, tags=["System"])
def get_health():
    """Health check endpoint returning ok status."""
    return {"status": "ok"}


@app.get("/facilities", response_model=List[Facility], tags=["Facilities"])
def get_facilities():
    """Returns all 20 healthcare facilities with geolocation, supplier, and nearest neighbors."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT facility_id, name, district, lat, lon, type, catchment_population, supplier_id, neighbors
        FROM facilities
        ORDER BY facility_id
    """)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "facility_id": r["facility_id"],
            "name": r["name"],
            "district": r["district"],
            "lat": r["lat"],
            "lon": r["lon"],
            "type": r["type"],
            "catchment_population": r["catchment_population"],
            "supplier_id": r["supplier_id"],
            "neighbors": json.loads(r["neighbors"]) if isinstance(r["neighbors"], str) else r["neighbors"],
        })
    return results


@app.get("/supplies", response_model=List[Supply], tags=["Supplies"])
def get_supplies():
    """Returns the catalog of 8 monitored medicines and their criticality tiers."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT medicine_id, name, unit, criticality_tier
        FROM supplies
        ORDER BY medicine_id
    """)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "medicine_id": r["medicine_id"],
            "name": r["name"],
            "unit": r["unit"],
            "criticality_tier": r["criticality_tier"],
        }
        for r in rows
    ]


@app.get("/inventory", response_model=List[InventorySnapshot], tags=["Inventory"])
def get_inventory(
    facility_id: Optional[str] = Query(None, description="Filter by facility ID (e.g. FAC-001)"),
    medicine_id: Optional[str] = Query(None, description="Filter by medicine ID (e.g. MED-001)"),
    from_date: Optional[str] = Query(None, alias="from", description="Start date (YYYY-MM-DD) inclusive"),
    to_date: Optional[str] = Query(None, alias="to", description="End date (YYYY-MM-DD) inclusive"),
):
    """Returns daily inventory snapshots with optional filtering by facility, medicine, and date range."""
    conditions = []
    params = []

    if facility_id and facility_id.strip():
        conditions.append("facility_id = ?")
        params.append(facility_id.strip())

    if medicine_id and medicine_id.strip():
        conditions.append("medicine_id = ?")
        params.append(medicine_id.strip())

    if from_date and from_date.strip():
        conditions.append("date >= ?")
        params.append(from_date.strip())

    if to_date and to_date.strip():
        conditions.append("date <= ?")
        params.append(to_date.strip())

    query = "SELECT facility_id, medicine_id, date, quantity_on_hand FROM inventory"
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY date ASC, facility_id ASC, medicine_id ASC"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "facility_id": r["facility_id"],
            "medicine_id": r["medicine_id"],
            "date": r["date"],
            "quantity_on_hand": r["quantity_on_hand"],
        }
        for r in rows
    ]


@app.get("/consumption", response_model=List[ConsumptionEvent], tags=["Consumption"])
def get_consumption(
    facility_id: Optional[str] = Query(None, description="Filter by facility ID (e.g. FAC-001)"),
    medicine_id: Optional[str] = Query(None, description="Filter by medicine ID (e.g. MED-001)"),
    from_date: Optional[str] = Query(None, alias="from", description="Start date (YYYY-MM-DD) inclusive"),
    to_date: Optional[str] = Query(None, alias="to", description="End date (YYYY-MM-DD) inclusive"),
):
    """Returns daily consumption records with optional filtering by facility, medicine, and date range."""
    conditions = []
    params = []

    if facility_id and facility_id.strip():
        conditions.append("facility_id = ?")
        params.append(facility_id.strip())

    if medicine_id and medicine_id.strip():
        conditions.append("medicine_id = ?")
        params.append(medicine_id.strip())

    if from_date and from_date.strip():
        conditions.append("date >= ?")
        params.append(from_date.strip())

    if to_date and to_date.strip():
        conditions.append("date <= ?")
        params.append(to_date.strip())

    query = "SELECT facility_id, medicine_id, date, quantity_dispensed FROM consumption"
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY date ASC, facility_id ASC, medicine_id ASC"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "facility_id": r["facility_id"],
            "medicine_id": r["medicine_id"],
            "date": r["date"],
            "quantity_dispensed": r["quantity_dispensed"],
        }
        for r in rows
    ]


@app.get("/replenishment", response_model=List[ReplenishmentEvent], tags=["Replenishment"])
def get_replenishment(
    facility_id: Optional[str] = Query(None, description="Filter by facility ID (e.g. FAC-001)"),
    medicine_id: Optional[str] = Query(None, description="Filter by medicine ID (e.g. MED-001)"),
    from_date: Optional[str] = Query(None, alias="from", description="Start order date (YYYY-MM-DD) inclusive"),
    to_date: Optional[str] = Query(None, alias="to", description="End order date (YYYY-MM-DD) inclusive"),
):
    """Returns replenishment order events with optional filtering by facility, medicine, and date range."""
    conditions = []
    params = []

    if facility_id and facility_id.strip():
        conditions.append("facility_id = ?")
        params.append(facility_id.strip())

    if medicine_id and medicine_id.strip():
        conditions.append("medicine_id = ?")
        params.append(medicine_id.strip())

    if from_date and from_date.strip():
        conditions.append("order_date >= ?")
        params.append(from_date.strip())

    if to_date and to_date.strip():
        conditions.append("order_date <= ?")
        params.append(to_date.strip())

    query = "SELECT facility_id, medicine_id, order_date, expected_date, actual_received_date, quantity FROM replenishment"
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY order_date ASC, facility_id ASC, medicine_id ASC"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "facility_id": r["facility_id"],
            "medicine_id": r["medicine_id"],
            "order_date": r["order_date"],
            "expected_date": r["expected_date"],
            "actual_received_date": r["actual_received_date"],
            "quantity": r["quantity"],
        }
        for r in rows
    ]

class ManualUpdate(BaseModel):
    medicine_id: str
    new_quantity: int
    note: str

class ShipmentUpdate(BaseModel):
    status: str
    expected_date: str

@app.get("/my-facility", tags=["Consumer"])
def get_my_facility(user: dict = Depends(get_current_user)):
    if user["role"] != "consumer":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not authorized as consumer")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM facilities WHERE facility_id = ?", (user["reference_id"],))
    fac = cursor.fetchone()
    conn.close()
    
    if fac:
        fac_dict = dict(fac)
        fac_dict["neighbors"] = json.loads(fac_dict["neighbors"]) if isinstance(fac_dict["neighbors"], str) else fac_dict["neighbors"]
        return fac_dict
    return None

@app.post("/inventory/manual-update", tags=["Consumer"])
def manual_update_inventory(update: ManualUpdate, user: dict = Depends(get_current_user)):
    if user["role"] != "consumer":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not authorized as consumer")
    
    facility_id = user["reference_id"]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT MAX(date) as max_date FROM inventory")
    row = cursor.fetchone()
    today = row["max_date"] if row and row["max_date"] else datetime.now().strftime("%Y-%m-%d")
    
    # Get current quantity
    cursor.execute("SELECT quantity_on_hand FROM inventory WHERE facility_id = ? AND medicine_id = ? AND date = ?", 
                   (facility_id, update.medicine_id, today))
    row = cursor.fetchone()
    old_qty = row["quantity_on_hand"] if row else 0
    
    # Update or insert into inventory
    if row:
        cursor.execute("UPDATE inventory SET quantity_on_hand = ? WHERE facility_id = ? AND medicine_id = ? AND date = ?",
                       (update.new_quantity, facility_id, update.medicine_id, today))
    else:
        cursor.execute("INSERT INTO inventory (facility_id, medicine_id, date, quantity_on_hand) VALUES (?, ?, ?, ?)",
                       (facility_id, update.medicine_id, today, update.new_quantity))
                       
    # Record in stock_updates
    cursor.execute("""
        INSERT INTO stock_updates (facility_id, medicine_id, user_id, role, old_qty, new_qty, note, source, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (facility_id, update.medicine_id, user["id"], user["role"], old_qty, update.new_quantity, update.note, "Facility-Reported", datetime.now().isoformat()))
    
    conn.commit()
    conn.close()
    
    import httpx
    try:
        httpx.post("http://localhost:8001/refresh", timeout=2.0)
    except Exception as e:
        print(f"Could not notify detection engine: {e}")
        
    return {"status": "success"}

@app.get("/my-shipments", tags=["Supplier"])
def get_my_shipments(user: dict = Depends(get_current_user)):
    if user["role"] != "supplier":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not authorized as supplier")
        
    supplier_id = user["reference_id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all facilities for this supplier
    cursor.execute("SELECT facility_id FROM facilities WHERE supplier_id = ?", (supplier_id,))
    facilities = [r["facility_id"] for r in cursor.fetchall()]
    
    if not facilities:
        conn.close()
        return []
        
    placeholders = ",".join("?" * len(facilities))
    cursor.execute(f"SELECT * FROM replenishment WHERE facility_id IN ({placeholders}) ORDER BY order_date DESC", facilities)
    shipments = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    return shipments

@app.post("/replenishment/{replenishment_id}/update-status", tags=["Supplier"])
def update_shipment_status(replenishment_id: int, update: ShipmentUpdate, user: dict = Depends(get_current_user)):
    if user["role"] != "supplier":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not authorized as supplier")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if shipment belongs to one of this supplier's facilities
    cursor.execute("SELECT r.* FROM replenishment r JOIN facilities f ON r.facility_id = f.facility_id WHERE r.id = ? AND f.supplier_id = ?", (replenishment_id, user["reference_id"]))
    shipment = cursor.fetchone()
    
    if not shipment:
        conn.close()
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Shipment not found or unauthorized")
        
    actual_received = datetime.now().strftime("%Y-%m-%d") if update.status == "delivered" else None
    
    cursor.execute("UPDATE replenishment SET status = ?, expected_date = ?, actual_received_date = ? WHERE id = ?",
                   (update.status, update.expected_date, actual_received, replenishment_id))
                   
    # If delivered, trigger a stock update
    if update.status == "delivered":
        cursor.execute("SELECT MAX(date) as max_date FROM inventory")
        row_max = cursor.fetchone()
        today = row_max["max_date"] if row_max and row_max["max_date"] else datetime.now().strftime("%Y-%m-%d")
        
        fac_id = shipment["facility_id"]
        med_id = shipment["medicine_id"]
        qty = shipment["quantity"]
        
        cursor.execute("SELECT quantity_on_hand FROM inventory WHERE facility_id = ? AND medicine_id = ? AND date = ?", 
                       (fac_id, med_id, today))
        row = cursor.fetchone()
        old_qty = row["quantity_on_hand"] if row else 0
        new_qty = old_qty + qty
        
        if row:
            cursor.execute("UPDATE inventory SET quantity_on_hand = ? WHERE facility_id = ? AND medicine_id = ? AND date = ?",
                           (new_qty, fac_id, med_id, today))
        else:
            cursor.execute("INSERT INTO inventory (facility_id, medicine_id, date, quantity_on_hand) VALUES (?, ?, ?, ?)",
                           (fac_id, med_id, today, new_qty))
                           
        cursor.execute("""
            INSERT INTO stock_updates (facility_id, medicine_id, user_id, role, old_qty, new_qty, note, source, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (fac_id, med_id, user["id"], user["role"], old_qty, new_qty, f"Delivery received: {qty}", "Supplier-Confirmed", datetime.now().isoformat()))
        
    conn.commit()
    conn.close()
    
    if update.status == "delivered":
        import httpx
        try:
            httpx.post("http://localhost:8001/refresh", timeout=2.0)
        except Exception as e:
            print(f"Could not notify detection engine: {e}")
            
    return {"status": "success"}

@app.get("/inventory/history", tags=["Inventory"])
def get_inventory_history(facility_id: str, medicine_id: str, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM stock_updates 
        WHERE facility_id = ? AND medicine_id = ?
        ORDER BY timestamp DESC
    """, (facility_id, medicine_id))
    history = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return history


class ApproveRecommendation(BaseModel):
    recommendation_id: str
    action_type: str
    medicine_name: str
    medicine_id: Optional[str] = None
    from_facility_id: Optional[str] = None
    to_facility_id: Optional[str] = None
    suggested_quantity: Optional[int] = None
    note: str = ""

@app.post("/recommendations/approve", tags=["Admin"])
def approve_recommendation(body: ApproveRecommendation, user: dict = Depends(get_current_user)):
    """
    Admin approves a triage recommendation.
    - Records it in approved_actions table.
    - If redistribution: transfers inventory between facilities in the DB
      so risk scores are correct after a restart.
    """
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can approve recommendations")

    conn = get_db_connection()
    cursor = conn.cursor()

    # Ensure approved_actions table exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS approved_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recommendation_id TEXT NOT NULL,
            action_type TEXT NOT NULL,
            medicine_name TEXT NOT NULL,
            approved_by INTEGER NOT NULL,
            note TEXT,
            timestamp TEXT NOT NULL
        )
    """)

    cursor.execute("""
        INSERT INTO approved_actions (recommendation_id, action_type, medicine_name, approved_by, note, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        body.recommendation_id,
        body.action_type,
        body.medicine_name,
        user["id"],
        body.note,
        datetime.now().isoformat()
    ))

    # For redistribution: physically move stock in the DB
    if body.action_type == "redistribution" and body.from_facility_id and body.to_facility_id and body.medicine_id and body.suggested_quantity:
        cursor.execute("SELECT MAX(date) as max_date FROM inventory")
        row_max = cursor.fetchone()
        today = row_max["max_date"] if row_max and row_max["max_date"] else datetime.now().strftime("%Y-%m-%d")
        
        from_fid = body.from_facility_id
        to_fid = body.to_facility_id
        mid = body.medicine_id
        qty = body.suggested_quantity

        # Get current quantities (latest date for each)
        def get_latest_qty(fid):
            cursor.execute("""
                SELECT quantity_on_hand FROM inventory
                WHERE facility_id = ? AND medicine_id = ?
                ORDER BY date DESC LIMIT 1
            """, (fid, mid))
            row = cursor.fetchone()
            return row["quantity_on_hand"] if row else 0

        from_qty = get_latest_qty(from_fid)
        to_qty = get_latest_qty(to_fid)
        actual_transfer = min(qty, from_qty)

        # Write today's updated snapshot for each facility
        for fid, new_qty in [(from_fid, max(0, from_qty - actual_transfer)), (to_fid, to_qty + actual_transfer)]:
            cursor.execute("SELECT id FROM inventory WHERE facility_id = ? AND medicine_id = ? AND date = ?", (fid, mid, today))
            if cursor.fetchone():
                cursor.execute("UPDATE inventory SET quantity_on_hand = ? WHERE facility_id = ? AND medicine_id = ? AND date = ?",
                               (new_qty, fid, mid, today))
            else:
                cursor.execute("INSERT INTO inventory (facility_id, medicine_id, date, quantity_on_hand) VALUES (?, ?, ?, ?)",
                               (fid, mid, today, new_qty))

        # Log in stock_updates audit table
        cursor.execute("""
            INSERT OR IGNORE INTO stock_updates (facility_id, medicine_id, user_id, role, old_qty, new_qty, note, source, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (to_fid, mid, user["id"], user["role"], to_qty, to_qty + actual_transfer,
              f"Transfer from {from_fid} — approved rec {body.recommendation_id}", "Admin-Approved", datetime.now().isoformat()))

    conn.commit()
    conn.close()
    return {"status": "approved", "recommendation_id": body.recommendation_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
