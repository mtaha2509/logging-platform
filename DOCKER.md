# Docker Setup for Logging Platform

This document explains how to run the complete logging platform using Docker Compose.

## 🏗️ **Project Structure**

```
logging-platform/
├── back-end/           # Spring Boot Backend
├── front-end/          # Oracle JET Frontend
├── fluent-bit-config/  # Log collection configuration
├── docker-compose.yml  # Full stack orchestration
└── DOCKER.md          # This documentation
```

## 🐳 **Services Overview**

### **Backend Services**
- **Redpanda**: Kafka-compatible message broker
- **Console**: Kafka management UI
- **Fluent-bit**: Log collection and forwarding
- **Backend**: Spring Boot API server

### **Frontend Services**
- **Frontend**: Production Oracle JET app (Nginx)
- **Frontend-dev**: Development Oracle JET app (Node.js)

## 🚀 **Quick Start**

### **Full Stack (Production)**
```bash
# Start all services
docker-compose up

# Or run in background
docker-compose up -d
```

### **Development Mode**
```bash
# Start backend services + development frontend
docker-compose --profile dev up

# Or run in background
docker-compose --profile dev up -d
```

### **Backend Only**
```bash
# Start only backend services (Redpanda, Console, Fluent-bit, Backend)
docker-compose up redpanda console fluent-bit backend
```

## 📋 **Service Ports**

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 3000 | Production Oracle JET app |
| **Frontend-dev** | 3001 | Development Oracle JET app |
| **Backend** | 8080 | Spring Boot API |
| **Console** | 8083 | Kafka management UI |
| **Redpanda** | 19092 | Kafka external access |
| **Fluent-bit** | 24224 | Log collection |

## 🔧 **Environment Configuration**

### **Frontend Environment Variables**
```yaml
# Production
NODE_ENV: production
REACT_APP_API_BASE_URL: http://backend:8080
REACT_APP_ENABLE_DEBUG_LOGS: false
REACT_APP_ENABLE_MOCK_DATA: false
REACT_APP_ENABLE_ANALYTICS: true

# Development
NODE_ENV: development
REACT_APP_API_BASE_URL: http://localhost:8080
REACT_APP_ENABLE_DEBUG_LOGS: true
REACT_APP_ENABLE_MOCK_DATA: true
REACT_APP_ENABLE_ANALYTICS: false
```

### **Backend Environment Variables**
```yaml
SPRING_PROFILES_ACTIVE: docker
KAFKA_BROKERS: redpanda:9092
```

## 🏃‍♂️ **Common Commands**

### **Start Services**
```bash
# Full stack
docker-compose up

# Development mode
docker-compose --profile dev up

# Specific services
docker-compose up backend frontend
```

### **Stop Services**
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### **View Logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
```

### **Rebuild Services**
```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build frontend
docker-compose build backend
```

## 🔍 **Health Checks**

### **Service Health**
```bash
# Check service status
docker-compose ps

# Check health status
docker-compose exec frontend curl http://localhost/health
docker-compose exec backend curl http://localhost:8080/actuator/health
```

### **Access Points**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Kafka Console**: http://localhost:8083
- **Kafka Broker**: localhost:19092

## 🛠️ **Development Workflow**

### **Frontend Development**
```bash
# Start development environment
docker-compose --profile dev up frontend-dev

# Make changes to front-end/ directory
# Changes are automatically reflected (hot reloading)
```

### **Backend Development**
```bash
# Start backend services
docker-compose up backend

# Make changes to back-end/ directory
# Rebuild when needed: docker-compose build backend
```

### **Full Development**
```bash
# Start everything in development mode
docker-compose --profile dev up

# Frontend: http://localhost:3001 (hot reloading)
# Backend: http://localhost:8080
```

## 🚀 **Production Deployment**

### **Build and Deploy**
```bash
# Build all services
docker-compose build

# Deploy to production
docker-compose up -d

# Check status
docker-compose ps
```

### **Environment-Specific Configuration**
```bash
# Use production environment file
docker-compose --env-file .env.production up

# Use test environment file
docker-compose --env-file .env.test up
```

## 🔒 **Security Considerations**

### **Network Isolation**
- All services run in `logging-network`
- Internal communication uses service names
- External access only through exposed ports

### **Environment Variables**
- Sensitive data via environment variables
- No hardcoded credentials in images
- Separate configurations per environment

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Port Conflicts**
   ```bash
   # Check if ports are in use
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :8080
   ```

2. **Service Dependencies**
   ```bash
   # Check service dependencies
   docker-compose config
   
   # Start services in order
   docker-compose up redpanda
   docker-compose up backend
   docker-compose up frontend
   ```

3. **Build Issues**
   ```bash
   # Clear Docker cache
   docker system prune
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Network Issues**
   ```bash
   # Check network connectivity
   docker network ls
   docker network inspect logging-platform_logging-network
   ```

### **Logs and Debugging**
```bash
# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f frontend
docker-compose logs -f backend

# Check service status
docker-compose ps
```

## 📊 **Monitoring**

### **Service Status**
```bash
# Check all services
docker-compose ps

# Check resource usage
docker stats
```

### **Health Endpoints**
- **Frontend**: http://localhost:3000/health
- **Backend**: http://localhost:8080/actuator/health
- **Kafka Console**: http://localhost:8083

## 🎯 **Best Practices**

1. **Use profiles** for different environments
2. **Set resource limits** in production
3. **Use health checks** for monitoring
4. **Keep secrets in environment variables**
5. **Regular security updates** of base images
6. **Monitor logs** for issues
7. **Use specific image tags** instead of `latest`

---

**Your complete logging platform is now containerized and ready for development and production!** 🎉

