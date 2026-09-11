"""
Data Loader — Dual-mode data access (API + CSV fallback)
========================================================
Tries teammate's FastAPI on localhost:8000 first.
If the API is not reachable, falls back to reading CSV files from a
configurable directory (default: ./test_data/).

All loaders return pandas DataFrames with consistent column names and types.
"""

import os
import json
import pandas as pd
import httpx

from config import API_BASE_URL, CSV_DATA_DIR


class DataLoader:
    """Load facility/inventory/consumption/replenishment data from API or CSV."""

    def __init__(self, api_base_url: str | None = None, csv_dir: str | None = None):
        self.api_base_url = api_base_url or API_BASE_URL
        self.csv_dir = csv_dir or CSV_DATA_DIR
        self.use_api = self._check_api()
        mode = "API" if self.use_api else f"CSV ({self.csv_dir})"
        print(f"[DataLoader] Using {mode} mode")

    # ─── API health check ───────────────────────────────────────────
    def _check_api(self) -> bool:
        """Return True if teammate's API is reachable."""
        try:
            r = httpx.get(f"{self.api_base_url}/facilities", timeout=3.0)
            return r.status_code == 200
        except (httpx.ConnectError, httpx.TimeoutException, httpx.ConnectTimeout):
            return False

    # ─── Individual loaders ─────────────────────────────────────────
    def load_facilities(self) -> pd.DataFrame:
        if self.use_api:
            r = httpx.get(f"{self.api_base_url}/facilities")
            df = pd.DataFrame(r.json())
        else:
            df = pd.read_csv(os.path.join(self.csv_dir, "facilities.csv"))
            # Parse neighbors JSON string → Python list
            if "neighbors" in df.columns:
                df["neighbors"] = df["neighbors"].apply(
                    lambda x: json.loads(x) if isinstance(x, str) else x
                )
        return df

    def load_supplies(self) -> pd.DataFrame:
        if self.use_api:
            r = httpx.get(f"{self.api_base_url}/supplies")
            return pd.DataFrame(r.json())
        return pd.read_csv(os.path.join(self.csv_dir, "supplies.csv"))

    def load_inventory(
        self,
        facility_id: str | None = None,
        medicine_id: str | None = None,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> pd.DataFrame:
        if self.use_api:
            params = {}
            if facility_id:
                params["facility_id"] = facility_id
            if medicine_id:
                params["medicine_id"] = medicine_id
            if from_date:
                params["from"] = from_date
            if to_date:
                params["to"] = to_date
            r = httpx.get(f"{self.api_base_url}/inventory", params=params)
            df = pd.DataFrame(r.json())
        else:
            df = pd.read_csv(os.path.join(self.csv_dir, "inventory.csv"))
            if facility_id:
                df = df[df["facility_id"] == facility_id]
            if medicine_id:
                df = df[df["medicine_id"] == medicine_id]

        if "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"])
        return df

    def load_consumption(
        self,
        facility_id: str | None = None,
        medicine_id: str | None = None,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> pd.DataFrame:
        if self.use_api:
            params = {}
            if facility_id:
                params["facility_id"] = facility_id
            if medicine_id:
                params["medicine_id"] = medicine_id
            if from_date:
                params["from"] = from_date
            if to_date:
                params["to"] = to_date
            r = httpx.get(f"{self.api_base_url}/consumption", params=params)
            df = pd.DataFrame(r.json())
        else:
            df = pd.read_csv(os.path.join(self.csv_dir, "consumption.csv"))
            if facility_id:
                df = df[df["facility_id"] == facility_id]
            if medicine_id:
                df = df[df["medicine_id"] == medicine_id]

        if "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"])
        return df

    def load_replenishment(
        self,
        facility_id: str | None = None,
        medicine_id: str | None = None,
    ) -> pd.DataFrame:
        if self.use_api:
            params = {}
            if facility_id:
                params["facility_id"] = facility_id
            if medicine_id:
                params["medicine_id"] = medicine_id
            r = httpx.get(f"{self.api_base_url}/replenishment", params=params)
            df = pd.DataFrame(r.json())
        else:
            df = pd.read_csv(os.path.join(self.csv_dir, "replenishment.csv"))
            if facility_id:
                df = df[df["facility_id"] == facility_id]
            if medicine_id:
                df = df[df["medicine_id"] == medicine_id]

        for col in ["order_date", "expected_date", "actual_received_date"]:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors="coerce")
        return df

    # ─── Convenience: load everything ───────────────────────────────
    def load_all(self) -> dict[str, pd.DataFrame]:
        """Load all five datasets and return as a dict of DataFrames."""
        return {
            "facilities": self.load_facilities(),
            "supplies": self.load_supplies(),
            "inventory": self.load_inventory(),
            "consumption": self.load_consumption(),
            "replenishment": self.load_replenishment(),
        }
