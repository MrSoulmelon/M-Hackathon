import sqlite3
conn = sqlite3.connect(r'backend\data\shortage_system.db')
c = conn.cursor()
c.execute("DELETE FROM inventory WHERE date >= '2026-04-01'")
c.execute("DELETE FROM stock_updates WHERE timestamp >= '2026-04-01'")
conn.commit()
conn.close()
