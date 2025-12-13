"""
Quick migration script to add group and tags columns to the service table
Run this once to update your existing database
"""
import sqlite3

# Connect to your database
conn = sqlite3.connect('./dallal.db')
cursor = conn.cursor()

try:
    # Add group column
    cursor.execute('ALTER TABLE service ADD COLUMN "group" VARCHAR DEFAULT "Default"')
    print("✅ Added 'group' column")
except sqlite3.OperationalError as e:
    if "duplicate column" in str(e).lower():
        print("ℹ️  'group' column already exists")
    else:
        print(f"❌ Error adding 'group' column: {e}")

try:
    # Add tags column  
    cursor.execute('ALTER TABLE service ADD COLUMN tags VARCHAR')
    print("✅ Added 'tags' column")
except sqlite3.OperationalError as e:
    if "duplicate column" in str(e).lower():
        print("ℹ️  'tags' column already exists")
    else:
        print(f"❌ Error adding 'tags' column: {e}")

conn.commit()
conn.close()

print("\n✅ Migration complete! You can now restart the backend.")
