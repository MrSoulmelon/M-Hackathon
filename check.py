import sqlite3
conn = sqlite3.connect(r'backend\data\shortage_system.db')
c = conn.cursor()
c.execute("SELECT quantity_on_hand FROM inventory WHERE facility_id='FAC-001' AND medicine_id='MED-003' ORDER BY date DESC LIMIT 1")
print(c.fetchone())
