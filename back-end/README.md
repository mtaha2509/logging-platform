# Centralized Logging Platform - Backend

A Spring Boot REST API for centralized log management, user authentication, and application monitoring.

## Quick Start

### Prerequisites
- Java 24+
- Maven 3.6+
- PostgreSQL 12+
- Apache Kafka 2.8+

### Setup

1. **Clone and navigate to the project**
   ```bash
   git clone <repository-url>
   cd logging-platform/back-end
   ```

2. **Database setup**
   ```bash
   createdb postgres
   psql -d postgres -c "CREATE SCHEMA IF NOT EXISTS \"logging-platform\";"
   ```

3. **Configure application**
   Update `src/main/resources/application.yml`:
   
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/postgres
       username: <your-username>
       password: <your-password>
     kafka:
       bootstrap-servers: localhost:19092
     security:
       oauth2:
         client:
           registration:
             google:
               client-id: <your-google-client-id>
               client-secret: <your-google-client-secret>
   ```

4. **Install dependencies and run migrations**
   ```bash
   mvn clean install
   mvn flyway:migrate
   ```

5. **Start the application**
   ```bash
   mvn spring-boot:run
   ```

The API will be available at `http://localhost:8080`

## Key Features

- **OAuth2 Authentication** - Google-based user authentication
- **Log Management** - Search, filter, and analyze application logs
- **User & Permission Management** - Role-based access control
- **Application Registration** - Manage applications sending logs
- **Alert System** - Create alerts based on log patterns
- **Real-time Processing** - Kafka-based log ingestion

## API Overview

### Authentication
- `GET /api/auth/user` - Get current user info

### Users
- `GET /users` - List all users
- `POST /users` - Create new user
- `GET /users/{id}/alerts` - Get user's alerts
- `GET /users/{id}/applications` - Get user's applications

### Applications
- `POST /applications` - Register new application
- `GET /applications/{id}` - Get application details
- `GET /applications/{id}/users` - Get application users

### Logs
- `GET /logs` - Search logs with filtering and pagination
- `GET /logs/analysis` - Get log trends and summaries

### Alerts
- `POST /alerts` - Create new alert (Admin only)
- `GET /alerts` - Get user alerts

### Permissions
- `POST /permissions` - Assign users to applications
- `DELETE /permissions` - Revoke user assignments

## Technology Stack

- **Spring Boot 3.5.5** - Application framework
- **Spring Security** - Authentication & authorization
- **Spring Data JPA** - Data persistence
- **PostgreSQL** - Primary database
- **Apache Kafka** - Log streaming
- **Redis** - Caching
- **OAuth2** - Google authentication
- **Flyway** - Database migrations
- **MapStruct** - Object mapping
- **Lombok** - Code generation

## Project Structure

```
src/main/java/com/example/backend/
├── BackEndApplication.java          # Main application
├── config/                          # Configuration classes
├── controllers/                     # REST controllers
├── services/                        # Business logic
├── repositories/                    # Data access
├── entities/                        # JPA entities
├── dtos/                           # Data transfer objects
├── mappers/                        # Object mappers
├── filter/                         # Custom filters
└── security/                       # Security components
```

## Database Schema

The application uses PostgreSQL with the following main entities:
- **Users** - System users with OAuth2 authentication
- **Applications** - Registered applications sending logs
- **Logs** - Application log entries with metadata
- **Alerts** - User-defined log monitoring alerts
- **Permissions** - User-application access mappings

## Development

### Adding New Features
1. Create entity (if needed)
2. Create repository interface
3. Implement service layer
4. Create REST controller
5. Add database migration
6. Write tests

### Testing
```bash
mvn test
```

### Code Style
- Use Lombok for boilerplate reduction
- Follow Spring Boot conventions
- Implement proper validation
- Add comprehensive documentation

## Deployment

### Environment Variables
```bash
export SPRING_PROFILES_ACTIVE=prod
export SPRING_DATASOURCE_URL=jdbc:postgresql://prod-db:5432/logging_platform
export SPRING_DATASOURCE_USERNAME=app_user
export SPRING_DATASOURCE_PASSWORD=secure_password
```

### Health Checks
- `/actuator/health` - Application health
- `/actuator/info` - Application info
- `/actuator/metrics` - Application metrics

## Documentation

For detailed technical documentation, API specifications, and architecture details, see:
- **[BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)** - Comprehensive technical documentation
- **[FRONTEND_API_DOCUMENTATION.md](./FRONTEND_API_DOCUMENTATION.md)** - Frontend integration guide

## Support

For questions or issues:
1. Check the detailed documentation
2. Review the Spring Boot logs
3. Verify configuration settings
4. Contact the development team

---

**Note**: This is the backend component of the Centralized Logging Platform. Make sure to also set up the frontend component for the complete system.
