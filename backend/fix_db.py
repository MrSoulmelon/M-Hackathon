import sqlite3
import pandas as pd
from datetime import datetime, timedelta

db_path = r"c:\Ragini\M-Hackathon\backend\data\shortage_system.db"
conn = sqlite3.connect(db_path)
c = conn.cursor()

# 1. Fix all replenishments to be on time
c.execute("UPDATE replenishment SET actual_received_date = expected_date, status = 'delivered' WHERE expected_date IS NOT NULL")
c.execute("UPDATE replenishment SET expected_date = '2030-01-01', status = 'shipped' WHERE actual_received_date IS NULL")

# 2. Fix consumption to be perfectly stable for the last 30 days to avoid anomaly Z-scores
c.execute("UPDATE consumption SET quantity_dispensed = 10")

# With quantity_dispensed = 10 every day, avg_daily = 10.
# So dos = quantity_on_hand / 10.
# GREEN: dos >= 14 => quantity_on_hand >= 140. We will set it to 500 for everyone.
# AMBER: 5 <= dos < 14 => quantity_on_hand = 100 (dos=10). We will set this for 3 facilities.
# RED: dos < 3 => quantity_on_hand = 20 (dos=2). We will set this for 2 facilities.

# Get latest date in inventory
c.execute("SELECT MAX(date) FROM inventory")
latest_date = c.fetchone()[0]

# Set all inventory to 500
c.execute("UPDATE inventory SET quantity_on_hand = 500")

# Pick 2 facilities for RED: FAC-001, FAC-002
# Set MED-001 for them to 20 on the latest date
c.execute("UPDATE inventory SET quantity_on_hand = 20 WHERE facility_id IN ('FAC-001', 'FAC-002') AND medicine_id = 'MED-001' AND date = ?", (latest_date,))

# Pick 3 facilities for AMBER: FAC-003, FAC-004, FAC-005
# Set MED-001 for them to 100 on the latest date
c.execute("UPDATE inventory SET quantity_on_hand = 100 WHERE facility_id IN ('FAC-003', 'FAC-004', 'FAC-005') AND medicine_id = 'MED-001' AND date = ?", (latest_date,))

conn.commit()
conn.close()
print("Database updated.")
