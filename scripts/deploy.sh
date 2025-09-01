#!/bin/bash

# Exit on error
set -e

# Pull the latest changes
echo "Pulling latest changes..."
git pull

# Navigate to backend and restart services
echo "Restarting backend services..."
cd backend
docker-compose down
docker-compose up -d --build

echo "Deployment completed successfully!"
