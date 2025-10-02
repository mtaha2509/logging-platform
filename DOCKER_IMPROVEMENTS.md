# 🐳 Docker Setup Analysis & Improvements

## ✅ What's Already Good

Your current Docker setup has several strengths:

1. **Multi-stage builds** - Backend uses build stage to reduce final image size
2. **Service orchestration** - docker-compose.yml properly defines all services
3. **Volume mounts** - Logs are persisted outside containers
4. **Environment variables** - Proper configuration management
5. **Network configuration** - Services can communicate

## ⚠️ Issues Found

### 1. Missing Network Assignment
Services aren't explicitly assigned to the network.

### 2. No Health Checks
Services don't have health checks, so dependent services might start before dependencies are ready.

### 3. No Resource Limits
No CPU/memory limits defined.

### 4. Security Concerns
- Running as root user
- No read-only filesystems
- No security options

## 🔧 Improved docker-compose.yml

Create `docker-compose.improved.yml`:

```yaml
version: '3.8'

services:
  redpanda:
    image: docker.redpanda.com/redpandadata/redpanda:v25.2.1
    container_name: logging-redpanda
    command:
      - redpanda start
      - --smp 1
      - --overprovisioned
      - --node-id 0
      - --check=false
      - --kafka-addr internal://0.0.0.0:9092,external://0.0.0.0:19092
      - --advertise-kafka-addr internal://redpanda:9092,external://localhost:19092
    ports:
      - "9092:9092"
      - "19092:19092"
    volumes:
      - redpanda-data:/var/lib/redpanda/data
    networks:
      - logging-network
    healthcheck:
      test: ["CMD", "rpk", "cluster", "health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    restart: unless-stopped

  console:
    image: docker.redpanda.com/redpandadata/console:v3.1.3
    container_name: logging-console
    ports:
      - "8083:8080"
    environment:
      KAFKA_BROKERS: redpanda:9092
    networks:
      - logging-network
    depends_on:
      redpanda:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    restart: unless-stopped

  fluent-bit:
    image: fluent/fluent-bit:1.9
    container_name: logging-fluent-bit
    ports:
      - "24224:24224"
    volumes:
      - ./fluent-bit-config/fluent-bit.conf:/fluent-bit/etc/fluent-bit.conf:ro
      - ./fluent-bit-config/parsers.conf:/fluent-bit/etc/parsers.conf:ro
      - /tmp/app-logs:/var/logs:ro
      - ./fluent-bit-data:/fluent-bit/db
    networks:
      - logging-network
    depends_on:
      redpanda:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "sh", "-c", "ps aux | grep fluent-bit | grep -v grep"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    restart: unless-stopped

  backend:
    build:
      context: ./back-end
      dockerfile: Dockerfile
    container_name: logging-backend
    ports:
      - "8080:8080"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    env_file:
      - ./back-end/.env
    environment:
      SPRING_PROFILES_ACTIVE: dev
      DB_HOST: host.docker.internal
      KAFKA_BOOTSTRAP_SERVERS: redpanda:9092
      LOG_FILE_PATH: logs/app.log
    volumes:
      - ./back-end/logs:/app/logs
    networks:
      - logging-network
    depends_on:
      redpanda:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    restart: unless-stopped

  frontend:
    build:
      context: ./front-end
      dockerfile: Dockerfile
    container_name: logging-frontend
    ports:
      - "8000:8000"
    environment:
      NODE_ENV: development
    networks:
      - logging-network
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    restart: unless-stopped

networks:
  logging-network:
    driver: bridge
    name: logging-network

volumes:
  redpanda-data:
    name: logging-redpanda-data
```

## 🔒 Security Improvements

### 1. Run as Non-Root User

Update `back-end/Dockerfile`:

```dockerfile
# Build stage
FROM maven:3.9.5-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-jammy

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Create logs directory and set permissions
RUN mkdir -p logs && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
```

### 2. Add Security Options

In docker-compose.yml, add:

```yaml
security_opt:
  - no-new-privileges:true
read_only: true
tmpfs:
  - /tmp
```

## 📊 Monitoring & Logging

### Add Logging Configuration

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🚀 Production Dockerfile

Create `back-end/Dockerfile.prod`:

```dockerfile
# Build stage
FROM maven:3.9.5-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy Maven files for dependency caching
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -Dspring.profiles.active=prod

# Runtime stage
FROM eclipse-temurin:21-jre-jammy

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy JAR
COPY --from=build /app/target/*.jar app.jar

# Create directories
RUN mkdir -p logs && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

EXPOSE 8080

# JVM optimization for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

## 🔧 Useful Docker Commands

### Development
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Restart service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build backend

# Stop all
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Debugging
```bash
# Execute command in container
docker-compose exec backend bash

# View container stats
docker stats

# Inspect container
docker inspect logging-backend

# View container logs
docker logs logging-backend --tail 100 -f
```

### Cleanup
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a --volumes
```

## 📝 Environment-Specific Configs

### docker-compose.dev.yml
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./back-end
      dockerfile: Dockerfile
    environment:
      SPRING_PROFILES_ACTIVE: dev
      SPRING_DEVTOOLS_RESTART_ENABLED: "true"
    volumes:
      - ./back-end/src:/app/src:ro
```

### docker-compose.prod.yml
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./back-end
      dockerfile: Dockerfile.prod
    environment:
      SPRING_PROFILES_ACTIVE: prod
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

## 🎯 Best Practices Checklist

- [x] Multi-stage builds
- [x] Health checks
- [x] Resource limits
- [x] Proper networking
- [x] Volume management
- [x] Environment variables
- [ ] Non-root user (implement above)
- [ ] Security options (implement above)
- [ ] Logging configuration
- [ ] Production optimizations

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Docker Compose Docs](https://docs.docker.com/compose/)

---

**Apply these improvements gradually and test each change!** 🚀
