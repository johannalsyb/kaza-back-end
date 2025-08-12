#!/bin/bash
# Start Redis server with config
redis-server /etc/redis/redis.conf
# Give Redis some time to start
sleep 2
# If dump.sql exists, import it into the database
if [ -f "/app/dump.sql" ]; then
  mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_DATABASE < /app/dump.sql
fi
# Run Directus bootstrap (skip admin init, ignore errors)
cd /app && npx directus bootstrap --skipAdminInit 2>/dev/null || true
# Run all new Directus migrations
echo "Running Directus migrations..."
npx directus database migrate:latest
# Check if migrations succeeded
if [ $? -ne 0 ]; then
  echo "Migration failed! Exiting..."
  exit 1
fi
# Clear Directus cache
npx directus cache:clear
# Start Directus in background (host 0.0.0.0, port 8055)
HOST=0.0.0.0 PORT=8055 npx directus start &
# Wait for Directus to start
sleep 10
# Start your API using Node.js (instead of Bun)
cd /app/api && HOST=0.0.0.0 PORT=4004 node src/server.js