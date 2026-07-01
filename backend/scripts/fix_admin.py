import sqlite3
import json

conn = sqlite3.connect('c:/Users/ARMAN/OneDrive/Desktop/legalai/backend/legalforge_auth.db')
conn.row_factory = sqlite3.Row
cur = conn.execute("SELECT * FROM users WHERE email='admin@legalforge.com'")
user = cur.fetchone()

if user:
    print(json.dumps(dict(user), indent=2))
    conn.execute("UPDATE users SET role='admin' WHERE email='admin@legalforge.com'")
    conn.commit()
    print("Updated admin role to 'admin'")
else:
    print("Admin user not found")

conn.close()
