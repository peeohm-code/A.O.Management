import os
import subprocess
from urllib.parse import urlparse

# Parse DATABASE_URL
db_url = os.environ.get('DATABASE_URL', '')
parsed = urlparse(db_url)

# Extract connection details
host = parsed.hostname
port = parsed.port or 3306
user = parsed.username
password = parsed.password
database = parsed.path.lstrip('/')

print(f"Connecting to database: {database} at {host}:{port}")

# Get all tables using mysql command
result = subprocess.run(
    f'mysql -h {host} -P {port} -u {user} -p"{password}" {database} -e "SHOW TABLES"',
    shell=True,
    capture_output=True,
    text=True
)

if result.returncode != 0:
    print(f"Error: {result.stderr}")
    exit(1)

# Parse tables
lines = result.stdout.strip().split('\n')[1:]  # Skip header
tables = [line.strip() for line in lines if line.strip()]

print(f"Found {len(tables)} tables: {tables}")

# Drop all tables except users
for table in tables:
    if table != 'users':
        print(f"Dropping table: {table}")
        drop_result = subprocess.run(
            f'mysql -h {host} -P {port} -u {user} -p"{password}" {database} -e "DROP TABLE IF EXISTS `{table}`"',
            shell=True,
            capture_output=True,
            text=True
        )
        if drop_result.returncode != 0:
            print(f"Error dropping {table}: {drop_result.stderr}")

print("Database cleared successfully!")
