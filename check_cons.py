import sqlite3
conn = sqlite3.connect(r'backend\data\shortage_system.db')
c = conn.cursor()
c.execute("SELECT quantity_dispensed FROM consumption LIMIT 5")
print(c.fetchall())
