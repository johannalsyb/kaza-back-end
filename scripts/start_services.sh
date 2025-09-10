#!/bin/bash
cd /home/ubuntu/kaza-back-end

echo "Installing dependencies..."
npm install

echo "Building containers with server config..."
docker compose -f docker-compose.simple.yml build --no-cache

echo "Starting containers..."
docker compose -f docker-compose.simple.yml up -d

echo "Waiting for containers..."
sleep 10

echo "Installing AWS CLI in database container..."
docker exec $(docker compose -f docker-compose.simple.yml ps -q db) sh -c "apt update && apt install -y awscli"

echo "Setting up AWS credentials..."
docker exec $(docker compose -f docker-compose.simple.yml ps -q db) mkdir -p /root/.aws
docker exec $(docker compose -f docker-compose.simple.yml ps -q db) sh -c "cat > /root/.aws/credentials << EOF
[default]
aws_access_key_id = REMOVED_AWS_KEY
aws_secret_access_key = REMOVED_AWS_SECRET
EOF"
docker exec $(docker compose -f docker-compose.simple.yml ps -q db) sh -c "cat > /root/.aws/config << EOF
[default]
region = eu-west-3
EOF"

echo "Running migrations..."
npm run migrate

echo "Restarting nginx..."
sudo systemctl restart nginx

echo "Cleaning up..."
docker system prune -f

echo "Deployment completed!"
docker compose -f docker-compose.simple.yml ps
