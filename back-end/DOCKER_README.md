# 🐳 Backend Docker Setup

## 📋 Overview

This Dockerfile builds **only the Spring Boot backend**. It's designed to connect to **local services** (PostgreSQL, Kafka, Redis) running on your host machine.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Docker        │    │   Host Machine  │
│                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │
│  │  Backend  │──┼────┼──│PostgreSQL │  │
│  │   App     │  │    │  │           │  │
│  │ (port     │  │    │  │(port 5432)│  │
│  │  8080)    │  │    │  └───────────┘  │
│  └───────────┘  │    │                 │
│                 │    │  ┌───────────┐  │
│                 │    │  │   Kafka   │  │
│                 │    │  │(port      │  │
│                 │    │  │ 19092)    │  │
│                 │    │  └───────────┘  │
│                 │    │                 │
│                 │    │  ┌───────────┐  │
│                 │    │  │   Redis   │  │
│                 │    │  │(port 6379)│  │
│                 │    │  └───────────┘  │
└─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Build the Image
```bash
docker build -t logging-platform-backend .
```

### 2. Run with Local Services
```bash
# Basic run (uses defaults)
docker run -p 8080:8080 \
  --env-file .env \
  logging-platform-backend

# With custom network (Linux)
docker run -p 8080:8080 \
  --network host \
  --env-file .env \
  logging-platform-backend

# With explicit host mapping (Mac/Windows)
docker run -p 8080:8080 \
  -e DB_HOST=host.docker.internal \
  -e KAFKA_BOOTSTRAP_SERVERS=host.docker.internal:19092 \
  -e REDIS_HOST=host.docker.internal \
  --env-file .env \
  logging-platform-backend
```

## 🔧 Configuration

### Environment Variables

The container expects these environment variables:

```env
# Database (connects to local PostgreSQL)
DB_HOST=host.docker.internal  # or localhost with --network host
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Kafka (connects to local Kafka)
KAFKA_BOOTSTRAP_SERVERS=host.docker.internal:19092

# Redis (connects to local Redis)
REDIS_HOST=host.docker.internal
REDIS_PORT=6379

# Security
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret

# Application
SPRING_PROFILES_ACTIVE=dev
```

### Platform-Specific Host Connection

| Platform | Host Address | Command |
|----------|--------------|---------|
| **Linux** | `localhost` | Use `--network host` |
| **Mac/Windows** | `host.docker.internal` | Default in Dockerfile |
| **Docker Desktop** | `host.docker.internal` | Default in Dockerfile |

## 📝 Usage Examples

### Development Mode
```bash
# With .env file
docker run -p 8080:8080 \
  --env-file .env \
  -e SPRING_PROFILES_ACTIVE=dev \
  logging-platform-backend
```

### Production Mode
```bash
# Production with specific config
docker run -p 8080:8080 \
  --env-file .env.production \
  -e SPRING_PROFILES_ACTIVE=prod \
  logging-platform-backend
```

### Linux with Host Network
```bash
# Direct host network access (Linux only)
docker run --network host \
  --env-file .env \
  -e DB_HOST=localhost \
  -e KAFKA_BOOTSTRAP_SERVERS=localhost:19092 \
  -e REDIS_HOST=localhost \
  logging-platform-backend
```

## 🛠️ Prerequisites

Before running the container, ensure these services are running locally:

### 1. PostgreSQL
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql
# or
ps aux | grep postgres

# Connect to verify
psql -h localhost -p 5432 -U postgres -d postgres
```

### 2. Kafka
```bash
# Check if Kafka is running
netstat -tulpn | grep 19092

# Test Kafka connectivity
kafka-topics.sh --bootstrap-server localhost:19092 --list
```

### 3. Redis
```bash
# Check if Redis is running
redis-cli ping

# Or check process
ps aux | grep redis
```

## 🔍 Debugging

### Check Container Connectivity
```bash
# Run container with shell access
docker run -it --entrypoint bash logging-platform-backend

# Test connectivity from inside container
nc -zv host.docker.internal 5432  # PostgreSQL
nc -zv host.docker.internal 19092 # Kafka
nc -zv host.docker.internal 6379  # Redis
```

### View Container Logs
```bash
# Start container and view logs
docker run -p 8080:8080 --env-file .env logging-platform-backend

# Or run in detached mode and view logs
docker run -d -p 8080:8080 --name backend --env-file .env logging-platform-backend
docker logs -f backend
```

### Health Check
```bash
# Check application health
curl http://localhost:8080/actuator/health

# Check from inside container
docker exec backend curl http://localhost:8080/actuator/health
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Refused to PostgreSQL**
   ```bash
   # Check PostgreSQL is accepting connections
   sudo netstat -tulpn | grep 5432
   
   # Update postgresql.conf
   listen_addresses = '*'
   
   # Update pg_hba.conf (add line)
   host all all 172.17.0.0/16 md5
   ```

2. **Cannot Connect to Kafka**
   ```bash
   # Check Kafka listeners configuration
   # In server.properties:
   listeners=PLAINTEXT://0.0.0.0:19092
   advertised.listeners=PLAINTEXT://localhost:19092
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis configuration
   # In redis.conf:
   bind 0.0.0.0
   protected-mode no
   ```

### Network Debugging
```bash
# Check Docker network
docker network ls

# Inspect bridge network
docker network inspect bridge

# Run with custom network
docker network create app-network
docker run --network app-network -p 8080:8080 logging-platform-backend
```

## 📦 Image Information

- **Base Image**: OpenJDK 24 Slim
- **Build Tool**: Maven 3.9.5
- **Security**: Non-root user
- **Health Check**: Built-in Spring Boot Actuator
- **Size**: Optimized with multi-stage build

## 🔗 Integration

This backend container is designed to be part of a larger system orchestrated at the parent directory level (`~/Desktop/logging-platform/docker-compose.yml`).

The parent compose file should handle:
- Frontend container
- Backend container (this one)
- Service networking
- Volume management
- Environment coordination