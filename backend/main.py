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
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "shortage_system.db")

app = FastAPI(
    title="Medicine Shortage Early-Warning API",
    description="Backend data API providing facility metadata, supplies catalog, inventory snapshots, consumption events, and replenishment orders.",
    version="1.0.0",
)

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
