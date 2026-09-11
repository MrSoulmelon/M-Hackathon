"""
Test and Verification Suite for Medicine Shortage Early-Warning System Backend.
Tests database integrity, API contract conformity, filtering, and injected disruptions.
"""

from datetime import datetime
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200, f"Health check failed: {response.text}"
    data = response.json()
    assert data == {"status": "ok"}, f"Unexpected health status: {data}"
    print("[PASS] GET /health returns {'status': 'ok'}")


def test_facilities():
    response = client.get("/facilities")
    assert response.status_code == 200, f"Facilities failed: {response.text}"
    data = response.json()
    assert len(data) == 20, f"Expected 20 facilities, got {len(data)}"

    # Check contract keys
    required_keys = {
        "facility_id", "name", "district", "lat", "lon", "type",
        "catchment_population", "supplier_id", "neighbors"
    }
    for fac in data:
        assert set(fac.keys()) == required_keys, f"Key mismatch in facility: {fac.keys()}"
        assert isinstance(fac["neighbors"], list), f"neighbors must be a list: {fac['neighbors']}"
        assert 2 <= len(fac["neighbors"]) <= 3, f"neighbors length should be 2-3: {fac['neighbors']}"
        assert fac["type"] in ("hospital", "clinic", "pharmacy")

    # Verify 4 districts with 5 facilities each
    districts = {}
    for fac in data:
        districts[fac["district"]] = districts.get(fac["district"], 0) + 1
    assert len(districts) == 4, f"Expected 4 districts, got {districts}"
    for d, count in districts.items():
        assert count == 5, f"District {d} has {count} facilities instead of 5"

    print("[PASS] GET /facilities conforms to exact contract with 20 facilities across 4 districts")


def test_supplies():
    response = client.get("/supplies")
    assert response.status_code == 200, f"Supplies failed: {response.text}"
    data = response.json()
    assert len(data) == 8, f"Expected 8 medicines, got {len(data)}"

    required_keys = {"medicine_id", "name", "unit", "criticality_tier"}
    for med in data:
        assert set(med.keys()) == required_keys, f"Key mismatch in supply: {med.keys()}"
        assert med["criticality_tier"] in ("essential", "routine")

    print("[PASS] GET /supplies conforms to exact contract with 8 medicines")


def test_inventory_and_filters():
    # 1. Check all inventory
    response = client.get("/inventory")
    assert response.status_code == 200
    all_inv = response.json()
    assert len(all_inv) == 14400, f"Expected 14,400 snapshots, got {len(all_inv)}"

    # 2. Check contract keys
    required_keys = {"facility_id", "medicine_id", "date", "quantity_on_hand"}
    assert set(all_inv[0].keys()) == required_keys

    # 3. Check filters: facility_id, medicine_id, from, to
    response = client.get("/inventory?facility_id=FAC-001&medicine_id=MED-001&from=2026-01-01&to=2026-01-10")
    assert response.status_code == 200
    filtered = response.json()
    assert len(filtered) == 10, f"Expected 10 records for 10-day filter, got {len(filtered)}"
    for item in filtered:
        assert item["facility_id"] == "FAC-001"
        assert item["medicine_id"] == "MED-001"
        assert "2026-01-01" <= item["date"] <= "2026-01-10"

    print("[PASS] GET /inventory conforms to contract and query filters work correctly")


def test_consumption_and_filters():
    # 1. Check all consumption
    response = client.get("/consumption")
    assert response.status_code == 200
    all_cons = response.json()
    assert len(all_cons) == 14400, f"Expected 14,400 consumption events, got {len(all_cons)}"

    # 2. Check contract keys
    required_keys = {"facility_id", "medicine_id", "date", "quantity_dispensed"}
    assert set(all_cons[0].keys()) == required_keys

    # 3. Check filters
    response = client.get("/consumption?facility_id=FAC-002&medicine_id=MED-002&from=2026-02-01&to=2026-02-05")
    assert response.status_code == 200
    filtered = response.json()
    assert len(filtered) == 5, f"Expected 5 records, got {len(filtered)}"
    for item in filtered:
        assert item["facility_id"] == "FAC-002"
        assert item["medicine_id"] == "MED-002"
        assert "2026-02-01" <= item["date"] <= "2026-02-05"

    print("[PASS] GET /consumption conforms to contract and query filters work correctly")


def test_replenishment_and_filters():
    # 1. Check all replenishment
    response = client.get("/replenishment")
    assert response.status_code == 200
    all_repl = response.json()
    assert len(all_repl) > 0

    # 2. Check contract keys
    required_keys = {"facility_id", "medicine_id", "order_date", "expected_date", "actual_received_date", "quantity"}
    assert set(all_repl[0].keys()) == required_keys

    # 3. Check filters
    response = client.get("/replenishment?facility_id=FAC-001&from=2026-01-01&to=2026-01-31")
    assert response.status_code == 200
    filtered = response.json()
    assert len(filtered) > 0
    for item in filtered:
        assert item["facility_id"] == "FAC-001"
        assert "2026-01-01" <= item["order_date"] <= "2026-01-31"

    print("[PASS] GET /replenishment conforms to contract and query filters work correctly")


def test_disruption_a_supplier_breakdown():
    """Verify that starting Day 60 (2026-03-01), replenishments under SUP-01 are delayed 5-10 days."""
    # Find all facilities under SUP-01
    facs_resp = client.get("/facilities").json()
    sup01_fac_ids = {f["facility_id"] for f in facs_resp if f["supplier_id"] == "SUP-01"}
    assert len(sup01_fac_ids) > 0, "No facilities found for SUP-01"

    repl_resp = client.get("/replenishment").json()

    # Pre-day 60 orders for SUP-01
    pre_delays = []
    # Post-day 60 orders for SUP-01
    post_delays = []

    for r in repl_resp:
        if r["facility_id"] in sup01_fac_ids:
            exp = datetime.strptime(r["expected_date"], "%Y-%m-%d")
            ord_date = r["order_date"]

            if ord_date < "2026-03-01":
                if r["actual_received_date"]:
                    act = datetime.strptime(r["actual_received_date"], "%Y-%m-%d")
                    pre_delays.append((act - exp).days)
            else:
                if r["actual_received_date"]:
                    act = datetime.strptime(r["actual_received_date"], "%Y-%m-%d")
                    delay = (act - exp).days
                    post_delays.append(delay)
                    # Must be 5 to 10 days late
                    assert 5 <= delay <= 10, f"Post-day 60 delay was {delay} days, expected 5-10 days: {r}"

    assert len(post_delays) > 0, "No post-day 60 received replenishments found for SUP-01"
    avg_pre_delay = sum(pre_delays) / len(pre_delays)
    avg_post_delay = sum(post_delays) / len(post_delays)

    print(f"[PASS] Disruption A verified:")
    print(f"       SUP-01 Pre-Day 60 avg delay: {avg_pre_delay:.2f} days")
    print(f"       SUP-01 Post-Day 60 avg delay: {avg_post_delay:.2f} days (5-10 days late injected)")


def test_disruption_b_local_outbreak():
    """Verify that starting Day 70 (2026-03-11), FAC-012 has a ~2x consumption spike for MED-001."""
    # Pre-day 70 consumption
    pre_resp = client.get("/consumption?facility_id=FAC-012&medicine_id=MED-001&from=2026-01-01&to=2026-03-10")
    pre_cons = [r["quantity_dispensed"] for r in pre_resp.json()]
    avg_pre = sum(pre_cons) / len(pre_cons)

    # Post-day 70 consumption
    post_resp = client.get("/consumption?facility_id=FAC-012&medicine_id=MED-001&from=2026-03-11&to=2026-03-31")
    post_cons = [r["quantity_dispensed"] for r in post_resp.json()]
    avg_post = sum(post_cons) / len(post_cons)

    ratio = avg_post / avg_pre
    print(f"[PASS] Disruption B verified:")
    print(f"       FAC-012 / MED-001 Pre-Day 70 avg daily: {avg_pre:.2f}")
    print(f"       FAC-012 / MED-001 Post-Day 70 avg daily: {avg_post:.2f}")
    print(f"       Consumption spike ratio: {ratio:.2f}x (target ~2.0x)")
    assert 1.6 <= ratio <= 2.4, f"Expected ~2x spike, got {ratio:.2f}x"


if __name__ == "__main__":
    print("=== Running Backend System & Contract Tests ===")
    test_health()
    test_facilities()
    test_supplies()
    test_inventory_and_filters()
    test_consumption_and_filters()
    test_replenishment_and_filters()
    test_disruption_a_supplier_breakdown()
    test_disruption_b_local_outbreak()
    print("=== All Tests Passed Successfully! ===")
