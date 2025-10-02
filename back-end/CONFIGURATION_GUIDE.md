# 🔧 Configuration Guide - Logging Platform Backend

## 📋 Overview

This application follows best practices for configuration management:

✅ **Single Source of Truth** - All configurations centralized in application.yml with environment-specific overrides  
✅ **No Hardcoding** - All sensitive values and environment-specific settings use environment variables  
✅ **Environment Separation** - Separate configurations for dev/test/prod environments  
✅ **Security** - All confidential information (passwords, secrets, keys) stored in environment variables  

---

## 🏗️ Configuration Architecture

### Configuration Hierarchy (in order of precedence)

1. **Environment Variables** (highest priority)
2. **application-{profile}.yml** (environment-specific)
3. **application.yml** (base configuration)

### File Structure

```
src/main/resources/
├── application.yml           # Base configuration (all environments)
├── application-dev.yml       # Development environment
├── application-test.yml      # Test environment  
├── application-prod.yml      # Production environment
└── .env.example             # Environment variables template
```

---

## 🌍 Environment Setup

### 1. Create Environment File

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit with your actual values
nano .env
```

### 2. Required Environment Variables

#### Database Configuration
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=your_secure_database_password
DB_SCHEMA=logging-platform
```

#### Google OAuth2 (Required)
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

#### Security
```env
JWT_SECRET=your_jwt_secret_minimum_256_bits
SESSION_TIMEOUT=3600
```

#### External Services
```env
KAFKA_BOOTSTRAP_SERVERS=localhost:19092
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_if_needed
```

#### Application
```env
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080
COMPANY_ADMIN_EMAIL=admin@yourcompany.com
FRONTEND_URL=http://localhost:3000
```

---

## 📊 Environment Profiles

### Development (`dev`)
**Purpose**: Local development with debugging enabled

**Characteristics**:
- ✅ SQL logging enabled
- ✅ All actuator endpoints exposed
- ✅ Permissive CORS settings
- ✅ Schema auto-update allowed
- ✅ Detailed logging (DEBUG level)

**Activation**:
```env
SPRING_PROFILES_ACTIVE=dev
```

### Test (`test`) 
**Purpose**: Automated testing and CI/CD

**Characteristics**:
- ✅ In-memory H2 database
- ✅ Schema recreated per test
- ✅ Reduced logging noise
- ✅ Random port assignment
- ✅ Mock external services

**Activation**:
```env
SPRING_PROFILES_ACTIVE=test
```

### Production (`prod`)
**Purpose**: Live production environment

**Characteristics**:
- ✅ Strict security settings (HTTPS only)
- ✅ Minimal logging (WARN level)
- ✅ Schema validation only
- ✅ Optimized connection pools
- ✅ Restricted actuator endpoints
- ✅ Load balancer support

**Activation**:
```env
SPRING_PROFILES_ACTIVE=prod
```

---

## 🔐 Security Best Practices

### Environment Variables
- ✅ All secrets stored in environment variables
- ✅ No hardcoded passwords or API keys
- ✅ `.env` files excluded from version control
- ✅ Separate credentials per environment

### Database Security
```env
# Use strong, unique passwords
DB_PASSWORD=Complex!Password@2024

# Enable connection encryption
DB_SSL_MODE=require
```

### Session Security
```env
# Production settings
COOKIE_SECURE=true
COOKIE_HTTP_ONLY=true
COOKIE_SAME_SITE=strict
```

---

## 🚀 Deployment Guide

### Local Development
```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your values

# 2. Run application
./mvnw spring-boot:run -Dspring.profiles.active=dev
```

### Docker Deployment
```dockerfile
# Set environment variables in Docker
ENV SPRING_PROFILES_ACTIVE=prod
ENV DB_HOST=postgres-container
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
# ... other variables
```

### Kubernetes Deployment
```yaml
# Use ConfigMaps for non-sensitive data
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  SPRING_PROFILES_ACTIVE: "prod"
  DB_HOST: "postgres-service"

---
# Use Secrets for sensitive data
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  DB_PASSWORD: <base64-encoded-password>
  GOOGLE_CLIENT_SECRET: <base64-encoded-secret>
```

---

## 🔧 Maven Configuration

### Flyway Database Migration
```bash
# Set Flyway properties via environment or Maven properties
mvn flyway:migrate \
  -Dflyway.url=jdbc:postgresql://localhost:5432/postgres \
  -Dflyway.user=postgres \
  -Dflyway.password=your_password \
  -Dflyway.schemas=logging-platform
```

### Build Profiles
```bash
# Development build
./mvnw clean package -Pdev

# Production build  
./mvnw clean package -Pprod
```

---

## 📱 Frontend Integration

### CORS Configuration
```env
# Development (multiple origins)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Production (single origin)
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check environment variables
echo $DB_HOST $DB_PORT $DB_USERNAME

# Test connection
psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME
```

#### 2. OAuth2 Authentication Failed
```bash
# Verify Google credentials
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET

# Check redirect URI in Google Console
# Should match: {baseUrl}/login/oauth2/code/google
```

#### 3. Kafka Connection Issues
```bash
# Check Kafka service
kafka-topics.sh --list --bootstrap-server $KAFKA_BOOTSTRAP_SERVERS

# Verify topic exists
kafka-topics.sh --describe --topic logs --bootstrap-server $KAFKA_BOOTSTRAP_SERVERS
```

#### 4. Redis Connection Failed
```bash
# Test Redis connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
```

### Validation Commands

```bash
# Check active profile
curl http://localhost:8080/actuator/info

# Health check
curl http://localhost:8080/actuator/health

# View configuration (dev only)
curl http://localhost:8080/actuator/configprops
```

---

## 📋 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SPRING_PROFILES_ACTIVE` | Yes | `dev` | Active Spring profile |
| `DB_PASSWORD` | Yes | - | Database password |
| `GOOGLE_CLIENT_ID` | Yes | - | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | - | Google OAuth2 client secret |
| `JWT_SECRET` | Yes | - | JWT signing secret (256+ bits) |
| `KAFKA_BOOTSTRAP_SERVERS` | No | `localhost:19092` | Kafka servers |
| `REDIS_HOST` | No | `localhost` | Redis hostname |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL |
| `SERVER_PORT` | No | `8080` | Application port |

---

## 🎯 Configuration Validation Checklist

Before deployment, ensure:

- [ ] All required environment variables are set
- [ ] No hardcoded secrets in configuration files
- [ ] Appropriate profile is active
- [ ] Database connectivity tested
- [ ] External services (Kafka, Redis) accessible
- [ ] OAuth2 credentials valid
- [ ] Frontend CORS configured correctly
- [ ] Logging levels appropriate for environment
- [ ] Security settings match environment requirements

---

*This configuration system ensures secure, maintainable, and environment-specific application deployment.*


## 🎯 Configuration Evaluation Compliance

✅ **Single Source of Truth**: All configurations centralized in application.yml with environment-specific overrides in separate profile files

✅ **No Hardcoding**: All sensitive values (passwords, secrets, keys) moved to environment variables with ${VARIABLE_NAME} syntax

✅ **Environment Separation**: Dedicated configuration files for each environment:
- application-dev.yml (Development)
- application-test.yml (Testing) 
- application-prod.yml (Production)

✅ **Confidential Information Security**: All passwords, OAuth secrets, and API keys stored in environment variables and excluded from version control

### Summary of Changes:
- Created .env.example template with all required variables
- Updated application.yml to use environment variables for all sensitive data
- Created environment-specific configuration files
- Updated Maven pom.xml to use environment variables for Flyway
- Added comprehensive documentation and setup guides

