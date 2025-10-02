# Simple Docker Setup for Development

This is a simplified Docker setup for running the logging platform in development mode.

## Prerequisites

1. **Docker** and **Docker Compose** installed
2. **PostgreSQL** running locally on `localhost:5432`
   - Database: `postgres`
   - Username: `postgres` 
   - Password: `ostrich2509`

## Quick Start

### Option 1: Use the startup script
```bash
./start-dev.sh
```

### Option 2: Manual commands
```bash
# Start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 8000 | Oracle JET app (development mode) |
| **Backend** | 8080 | Spring Boot API |
| **Console** | 8083 | Kafka management UI |
| **Redpanda** | 19092 | Kafka broker (external) |

## Access Points

- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:8080
- **Kafka Console**: http://localhost:8083

## Configuration

- **Database**: Uses your local PostgreSQL (not containerized)
- **Kafka**: Redpanda container for message streaming
- **Log Collection**: Fluent Bit for log ingestion

## Troubleshooting

### Check service status
```bash
docker compose ps
```

### View specific service logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Rebuild a specific service
```bash
docker compose build backend
docker compose up -d backend
```

### Reset everything
```bash
docker compose down
docker compose up --build -d
```
