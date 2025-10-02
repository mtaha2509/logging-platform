# Centralized Logging Platform

A comprehensive, production-ready logging platform built with Spring Boot, Oracle JET, Kafka (Redpanda), and Fluent Bit.

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Applications   │────▶│  Fluent Bit  │────▶│  Redpanda   │
│  (Log Sources)  │     │  (Collector) │     │   (Kafka)   │
└─────────────────┘     └──────────────┘     └──────┬──────┘
                                                     │
                                                     ▼
                                              ┌─────────────┐
                                              │   Backend   │
                                              │ Spring Boot │
                                              └──────┬──────┘
                                                     │
                                              ┌──────▼──────┐
                                              │  PostgreSQL │
                                              │  Database   │
                                              └─────────────┘
                                                     ▲
                                                     │
                                              ┌──────┴──────┐
                                              │  Frontend   │
                                              │ Oracle JET  │
                                              └─────────────┘
```

## ✨ Features

### Core Functionality
- ✅ **Real-time Log Ingestion** - Fluent Bit → Kafka → Spring Boot
- ✅ **Centralized Storage** - PostgreSQL with optimized indexing
- ✅ **Advanced Search & Filtering** - Multi-criteria log queries
- ✅ **Alert System** - Threshold-based alerting with notifications
- ✅ **User Management** - Role-based access control (ADMIN/USER)
- ✅ **Application Management** - Multi-tenant application tracking
- ✅ **Dashboard Analytics** - Real-time metrics and visualizations

### Security
- ✅ OAuth2 Google Authentication
- ✅ Role-based authorization
- ✅ Input validation with Bean Validation (JSR-303)
- ✅ SQL injection prevention
- ✅ XSS protection

### Technical Features
- ✅ RESTful API with DTO pattern
- ✅ Global exception handling
- ✅ Request tracing with correlation IDs
- ✅ Database migrations with Flyway
- ✅ Comprehensive logging with Log4j2
- ✅ Docker containerization
- ✅ Responsive UI with Oracle JET

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- PostgreSQL (running locally or accessible)
- Java 21 (for local development)
- Node.js 18+ (for local development)

### 1. Clone Repository
```bash
git clone https://github.com/mtaha2509/logging-platform.git
cd logging-platform
```

### 2. Configure Environment
Create `.env` file in `back-end/` directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# OAuth2 Configuration
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID=your_client_id
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET=your_client_secret
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google

# Application Configuration
SPRING_PROFILES_ACTIVE=dev
SERVER_PORT=8080
```

### 3. Setup Database
```bash
# Run PostgreSQL configuration script
chmod +x configure-postgresql.sh
./configure-postgresql.sh
```

### 4. Start Services with Docker Compose
```bash
docker-compose up -d
```

Services will be available at:
- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:8080
- **Redpanda Console**: http://localhost:8083
- **Fluent Bit**: localhost:24224

### 5. Access Application
1. Navigate to http://localhost:8000
2. Login with Google OAuth2
3. First user will be assigned ADMIN role

## 🛠️ Development Setup

### Backend (Spring Boot)
```bash
cd back-end

# Install dependencies
mvn clean install

# Run application
mvn spring-boot:run

# Run tests
mvn test

# Build JAR
mvn clean package
```

### Frontend (Oracle JET)
```bash
cd front-end

# Install dependencies
npm install

# Start development server
npm run serve

# Build for production
npm run build
```

## 📁 Project Structure

```
logging-platform/
├── back-end/                    # Spring Boot Backend
│   ├── src/main/java/
│   │   └── com/example/backend/
│   │       ├── config/          # Configuration classes
│   │       ├── controllers/     # REST controllers
│   │       ├── dtos/            # Data Transfer Objects
│   │       ├── entities/        # JPA entities
│   │       ├── mappers/         # MapStruct mappers
│   │       ├── repositories/    # Spring Data repositories
│   │       ├── services/        # Business logic
│   │       ├── security/        # Security configuration
│   │       └── validation/      # Custom validators
│   ├── src/main/resources/
│   │   ├── db/migration/        # Flyway migrations
│   │   └── application.yml      # Application config
│   ├── Dockerfile
│   └── pom.xml
│
├── front-end/                   # Oracle JET Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── pages/           # Page components
│   │   │   └── shell/           # App shell
│   │   ├── services/            # API services
│   │   ├── contexts/            # React contexts
│   │   └── config/              # Configuration
│   ├── Dockerfile
│   └── package.json
│
├── fluent-bit-config/           # Fluent Bit configuration
│   ├── fluent-bit.conf
│   └── parsers.conf
│
├── docker-compose.yml           # Docker orchestration
└── README.md                    # This file
```

## 🔌 API Documentation

### Authentication
All API endpoints require authentication except `/login` and OAuth2 callbacks.

### Base URL
```
http://localhost:8080
```

### Key Endpoints

#### Users
- `GET /users` - List all users (ADMIN only)
- `POST /users` - Create user (ADMIN only)
- `GET /users/{id}/applications` - Get user's applications

#### Applications
- `GET /applications` - List applications
- `POST /applications` - Create application (ADMIN only)
- `PATCH /applications/{id}` - Update application (ADMIN only)
- `GET /applications/{id}/users` - Get application users

#### Logs
- `GET /logs` - Search logs with filters
- `GET /logs/analysis` - Get log analytics

#### Alerts
- `GET /alerts` - List alerts (ADMIN only)
- `POST /alerts` - Create alert (ADMIN only)
- `PATCH /alerts/{id}` - Update alert (ADMIN only)

#### Permissions
- `POST /permissions` - Assign permissions (ADMIN only)
- `DELETE /permissions` - Revoke permissions (ADMIN only)

### Request/Response Examples

#### Create Alert
```bash
POST /alerts
Content-Type: application/json

{
  "applicationId": 1,
  "severityLevel": "ERROR",
  "count": 10,
  "timeWindow": "PT5M"
}
```

Response:
```json
{
  "id": 1,
  "applicationId": 1,
  "applicationName": "Payment Service",
  "level": "ERROR",
  "count": 10,
  "timeWindow": "PT5M",
  "isActive": true,
  "updatedAt": "2025-10-01T22:00:00Z"
}
```

## 🔐 Security

### Authentication Flow
1. User clicks "Login with Google"
2. Redirected to Google OAuth2
3. After authentication, redirected back with authorization code
4. Backend exchanges code for tokens
5. Session created with user details
6. Frontend stores session cookie

### Authorization
- **ADMIN**: Full access to all features
- **USER**: Read-only access to assigned applications

### Input Validation
All DTOs use Bean Validation (JSR-303):
- `@NotNull`, `@NotBlank` - Required fields
- `@Email` - Email format validation
- `@Pattern` - Regex validation
- `@Min`, `@Max` - Numeric range validation
- `@Size` - String length validation

## 🐳 Docker

### Build Images
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
```

### Run Services
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Health Checks
```bash
# Check backend health
curl http://localhost:8080/actuator/health

# Check Redpanda
docker-compose exec redpanda rpk cluster health
```

## 📊 Database Schema

### Key Tables
- **users** - User accounts and roles
- **registered_applications** - Application registry
- **logs** - Centralized log storage
- **alerts** - Alert configurations
- **permissions** - User-application access control
- **notifications** - Alert notifications

### Migrations
Database migrations are managed by Flyway and located in `back-end/src/main/resources/db/migration/`.

## 🧪 Testing

### Backend Tests
```bash
cd back-end
mvn test
```

### API Testing
```bash
# Test backend connectivity
./test-backend.sh
```

## 📝 Logging

### Application Logs
- **Location**: `back-end/logs/app.log`
- **Format**: JSON with correlation IDs
- **Rotation**: Daily with 30-day retention

### Log Levels
- **ERROR**: Critical errors requiring immediate attention
- **WARN**: Warning conditions
- **INFO**: Informational messages
- **DEBUG**: Detailed debugging information

## 🚢 Deployment

### Production Checklist
- [ ] Update `.env` with production values
- [ ] Configure production database
- [ ] Set up SSL/TLS certificates
- [ ] Configure OAuth2 with production URLs
- [ ] Enable production logging
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Review security settings

### Environment Variables
See `.env.example` for required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Muhammad Taha - Initial work - [@mtaha2509](https://github.com/mtaha2509)

## 🙏 Acknowledgments

- Spring Boot for the robust backend framework
- Oracle JET for the enterprise UI framework
- Redpanda for Kafka-compatible streaming
- Fluent Bit for log collection

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/mtaha2509/logging-platform/issues
- Email: your-email@example.com

---

**Built with ❤️ using Spring Boot, Oracle JET, and modern DevOps practices**
