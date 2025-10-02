#!/bin/bash

# Simple development startup script for the logging platform

echo "🚀 Starting Logging Platform in Development Mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if PostgreSQL is running locally
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL is not running on localhost:5432"
    echo "   Please start your local PostgreSQL database first."
    echo "   Expected connection: postgres@localhost:5432/postgres"
    exit 1
fi

echo "✅ Docker is running"
echo "✅ PostgreSQL is running"

# Build and start all services
echo "🔨 Building and starting services..."
docker compose up --build -d

echo ""
echo "🎉 Services started successfully!"
echo ""
echo "📋 Access Points:"
echo "   Frontend:  http://localhost:8000"
echo "   Backend:   http://localhost:8080"
echo "   Console:   http://localhost:8083"
echo ""
echo "📊 To view logs:"
echo "   docker compose logs -f"
echo ""
echo "🛑 To stop services:"
echo "   docker compose down"
