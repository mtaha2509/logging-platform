#!/bin/bash

echo "🧪 Testing Backend Docker Setup..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if PostgreSQL is running locally
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL is not running on localhost:5432"
    echo "   Please start your local PostgreSQL database first."
    exit 1
fi

echo "✅ Docker is running"
echo "✅ PostgreSQL is running"

# Build and start backend only
echo "🔨 Building backend..."
docker compose build backend

echo "🚀 Starting backend..."
docker compose up -d backend

echo "⏳ Waiting for backend to start..."
sleep 15

# Check if backend is responding
echo "🔍 Testing backend health..."
if curl -s http://localhost:8080/actuator/health > /dev/null; then
    echo "✅ Backend is running and responding!"
    echo "📊 Backend health:"
    curl -s http://localhost:8080/actuator/health | jq . 2>/dev/null || curl -s http://localhost:8080/actuator/health
else
    echo "❌ Backend is not responding"
    echo "📋 Backend logs:"
    docker compose logs backend
fi

echo ""
echo "🛑 To stop backend:"
echo "   docker compose down backend"
