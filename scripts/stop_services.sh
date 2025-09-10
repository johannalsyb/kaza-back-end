#!/bin/bash
cd /home/ubuntu/kaza-back-end
echo "Stopping Kaza containers..."
docker compose -f docker-compose.simple.yml down
echo "Kaza services stopped"
