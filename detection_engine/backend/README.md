# Medicine Shortage Early-Warning System — Backend API & Data Layer

A high-performance data layer and REST API built for healthcare facility medicine shortage monitoring, early-warning detection, and risk scoring.

---

## Overview

- **Facilities**: 20 healthcare facilities across 4 districts (Central, North, Highland, South) with geographic coordinates, catchment populations, supplier mappings, and nearest neighbor facility lists.
- **Supplies Catalog**: 8 monitored medicines across `essential` and `routine` criticality tiers.
- **Operational Data**: 90 days of daily Inventory Snapshots (14,400 records), Consumption Events (14,400 records), and Replenishment Order Events.
- **Injected Disruption Scenarios**:
  - **Disruption A (Supplier Breakdown)**: Starting Day 60 (`2026-03-01`), **all facilities under supplier `SUP-01`** receive replenishments 5–10 days late (simulates regional distribution breakdown).
  - **Disruption B (Local Demand Surge / Mini-Outbreak)**: Starting Day 70 (`2026-03-11`), facility **`FAC-012` (Highland Community Clinic)** experiences a sudden **2x spike in consumption of `MED-001` (Amoxicillin 500mg)** while its replenishment stays normal.
- **Storage**: Available both as CSV files (`data/csv/`) and a high-performance SQLite database (`data/shortage_system.db`).
- **REST API**: Built with FastAPI, CORS enabled for all origins, and query parameter filtering (`facility_id`, `medicine_id`, `from`, `to`).

---

## Setup & Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

*(Dependencies: `fastapi`, `uvicorn`, `pandas`, `numpy`, `httpx`)*

---

## Running the Synthetic Data Generator

To regenerate the CSV files and SQLite database:

```bash
python generator.py
```

This generates:
- `data/csv/facilities.csv`
- `data/csv/supplies.csv`
- `data/csv/inventory.csv`
- `data/csv/consumption.csv`
- `data/csv/replenishment.csv`
- `data/shortage_system.db` (with indexed tables for instant query response)

---

## Starting the API Server

The API runs by default on `http://localhost:8000`.

To start the server:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Or run directly via python:

```bash
python main.py
```

- Interactive Swagger Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Interactive ReDoc Documentation: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Running Tests

Run the verification test suite:

```bash
python test_system.py
```

---

## API Contract & Example `curl` Commands

### 1. Health Check
Checks if the API service is online.

- **Endpoint**: `GET /health`
- **Response**: `{"status": "ok"}`
- **Curl Example**:
  ```bash
  curl -s http://localhost:8000/health
  ```

---

### 2. Facilities
Returns all 20 healthcare facilities with geolocation coordinates, catchment population, assigned supplier, and nearest neighbor facility IDs.

- **Endpoint**: `GET /facilities`
- **Response Schema**:
  ```json
  [
    {
      "facility_id": "FAC-001",
      "name": "Central General Hospital",
      "district": "Central",
      "lat": 13.012451,
      "lon": 77.597926,
      "type": "hospital",
      "catchment_population": 85000,
      "supplier_id": "SUP-01",
      "neighbors": ["FAC-003", "FAC-005", "FAC-004"]
    }
  ]
  ```
- **Curl Example**:
  ```bash
  curl -s http://localhost:8000/facilities
  ```

---

### 3. Supplies Catalog
Returns the list of 8 medicines and their criticality tier (`essential` or `routine`).

- **Endpoint**: `GET /supplies`
- **Response Schema**:
  ```json
  [
    {
      "medicine_id": "MED-001",
      "name": "Amoxicillin 500mg",
      "unit": "capsules",
      "criticality_tier": "essential"
    }
  ]
  ```
- **Curl Example**:
  ```bash
  curl -s http://localhost:8000/supplies
  ```

---

### 4. Inventory Snapshots
Returns daily inventory snapshots (`quantity_on_hand`). Supports optional filtering by facility, medicine, and date range.

- **Endpoint**: `GET /inventory?facility_id=&medicine_id=&from=&to=`
- **Query Parameters**:
  - `facility_id` *(optional)*: e.g. `FAC-001`
  - `medicine_id` *(optional)*: e.g. `MED-001`
  - `from` *(optional)*: Start date `YYYY-MM-DD` (inclusive)
  - `to` *(optional)*: End date `YYYY-MM-DD` (inclusive)
- **Response Schema**:
  ```json
  [
    {
      "facility_id": "FAC-001",
      "medicine_id": "MED-001",
      "date": "2026-01-01",
      "quantity_on_hand": 3321
    }
  ]
  ```
- **Curl Examples**:
  ```bash
  # Query specific facility, medicine, and date window
  curl -s "http://localhost:8000/inventory?facility_id=FAC-001&medicine_id=MED-001&from=2026-01-01&to=2026-01-10"

  # Query all inventory for a single facility
  curl -s "http://localhost:8000/inventory?facility_id=FAC-001"
  ```

---

### 5. Consumption Events
Returns daily consumption history (`quantity_dispensed`). Supports optional filtering by facility, medicine, and date range.

- **Endpoint**: `GET /consumption?facility_id=&medicine_id=&from=&to=`
- **Query Parameters**:
  - `facility_id` *(optional)*: e.g. `FAC-012`
  - `medicine_id` *(optional)*: e.g. `MED-001`
  - `from` *(optional)*: Start date `YYYY-MM-DD` (inclusive)
  - `to` *(optional)*: End date `YYYY-MM-DD` (inclusive)
- **Response Schema**:
  ```json
  [
    {
      "facility_id": "FAC-001",
      "medicine_id": "MED-001",
      "date": "2026-01-01",
      "quantity_dispensed": 149
    }
  ]
  ```
- **Curl Examples**:
  ```bash
  # Query consumption for the outbreak facility
  curl -s "http://localhost:8000/consumption?facility_id=FAC-012&medicine_id=MED-001&from=2026-03-01&to=2026-03-20"
  ```

---

### 6. Replenishment Events
Returns replenishment order records (`order_date`, `expected_date`, `actual_received_date`, `quantity`). `actual_received_date` is `null` if the shipment is still pending or delayed beyond the simulation cutoff. Supports filtering by facility, medicine, and order date range.

- **Endpoint**: `GET /replenishment?facility_id=&medicine_id=&from=&to=`
- **Query Parameters**:
  - `facility_id` *(optional)*: e.g. `FAC-001`
  - `medicine_id` *(optional)*: e.g. `MED-001`
  - `from` *(optional)*: Start order date `YYYY-MM-DD` (inclusive)
  - `to` *(optional)*: End order date `YYYY-MM-DD` (inclusive)
- **Response Schema**:
  ```json
  [
    {
      "facility_id": "FAC-001",
      "medicine_id": "MED-001",
      "order_date": "2026-01-16",
      "expected_date": "2026-01-19",
      "actual_received_date": "2026-01-19",
      "quantity": 1725
    }
  ]
  ```
- **Curl Examples**:
  ```bash
  # Check delayed replenishments for a disrupted facility
  curl -s "http://localhost:8000/replenishment?facility_id=FAC-001&from=2026-03-01&to=2026-03-31"
  ```

---

## Disruption Details for Demos & Risk Scoring

### Disruption A: Supplier Breakdown
- **Supplier ID**: `SUP-01`
- **Disruption Start Date**: `2026-03-01` (Day 60)
- **Affected Facilities**:
  - `FAC-001` (Central General Hospital, Central)
  - `FAC-002` (Downtown Community Clinic, Central)
  - `FAC-004` (Metro Care Clinic, Central)
  - `FAC-006` (Northside Medical Center, North)
  - `FAC-007` (River North Family Clinic, North)
  - `FAC-009` (Highland Valley Clinic, North)
- **Signature**: All orders placed from Day 60 onwards arrive 5–10 days past their expected delivery date (or remain unreceived), causing widespread stock depletion and stockouts across all 6 facilities.

### Disruption B: Local Demand Surge / Mini-Outbreak
- **Facility ID**: `FAC-012` (*Highland Community Clinic*)
- **District**: `Highland`
- **Supplier**: `SUP-03` (independent of `SUP-01`)
- **Medicine ID**: `MED-001` (*Amoxicillin 500mg*, essential antibiotic)
- **Disruption Start Date**: `2026-03-11` (Day 70)
- **Signature**: Pre-Day 70 average consumption is ~13.8 units/day. Starting Day 70, average consumption abruptly doubles to ~26.4 units/day (a 1.9x–2.0x surge). Replenishments and lead times remain standard, resulting in rapid depletion and stockouts.
