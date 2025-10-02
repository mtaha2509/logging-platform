# 🚀 Quick Environment Setup Guide

## ⚡ 5-Minute Setup

### 1. Create Environment File
```bash
# Copy the template
cp .env.example .env

# Edit with your values
nano .env
```

### 2. Minimum Required Variables
```env
# Database (UPDATE THESE!)
DB_PASSWORD=your_actual_database_password

# Google OAuth2 (REQUIRED - Get from Google Console)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Security (GENERATE STRONG SECRET!)
JWT_SECRET=generate_a_secure_256_bit_secret_here

# Environment
SPRING_PROFILES_ACTIVE=dev
```

### 3. Run Application
```bash
# Start the application
./mvnw spring-boot:run
```

---

## 🔑 Getting Google OAuth2 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set authorized redirect URI: `http://localhost:8080/login/oauth2/code/google`
6. Copy Client ID and Client Secret to your `.env` file

---

## 🔧 Maven Flyway Configuration

Set these properties for database migration:

```bash
# Option 1: Environment variables
export flyway.url=jdbc:postgresql://localhost:5432/postgres
export flyway.user=postgres  
export flyway.password=your_password
export flyway.schemas=logging-platform

# Option 2: Maven command line
./mvnw flyway:migrate \
  -Dflyway.url=jdbc:postgresql://localhost:5432/postgres \
  -Dflyway.user=postgres \
  -Dflyway.password=your_password \
  -Dflyway.schemas=logging-platform
```

---

## 🌍 Environment Profiles

| Profile | Purpose | Database | Logging |
|---------|---------|----------|---------|
| `dev` | Development | PostgreSQL | DEBUG |
| `test` | Testing | H2 Memory | INFO |
| `prod` | Production | PostgreSQL | WARN |

Switch profiles:
```env
SPRING_PROFILES_ACTIVE=dev   # or test, prod
```

---

## ✅ Validation

Test your setup:
```bash
# Check health
curl http://localhost:8080/actuator/health

# Check profile
curl http://localhost:8080/actuator/info

# Test OAuth2 login
open http://localhost:8080/oauth2/authorization/google
```

---

## 🆘 Common Issues

### Issue: Database Connection Failed
**Solution**: Check `DB_*` variables in `.env`

### Issue: OAuth2 Failed  
**Solution**: Verify Google credentials and redirect URI

### Issue: Application Won't Start
**Solution**: Ensure all required variables are set:
```bash
grep -E "(DB_PASSWORD|GOOGLE_CLIENT|JWT_SECRET)" .env
```

---

For detailed configuration information, see [CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md)
