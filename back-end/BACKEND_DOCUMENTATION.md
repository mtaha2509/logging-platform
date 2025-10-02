# Centralized Logging Platform - Backend Documentation

## Overview

This is a comprehensive Spring Boot backend application for a centralized logging platform that provides secure log management, user authentication, application monitoring, and alert systems. The platform supports role-based access control with graceful error handling throughout all operations.

## Architecture

### Technology Stack
- **Framework**: Spring Boot 3.x
- **Security**: Spring Security with OAuth2 Google Authentication
- **Database**: JPA/Hibernate with configurable database support
- **Build Tool**: Maven
- **Java Version**: 17+
- **Logging**: SLF4J with Logback

### Key Features
- ✅ OAuth2 Google Authentication
- ✅ Role-based Access Control (USER/ADMIN)
- ✅ Comprehensive Error Handling
- ✅ Log Management with Filtering & Search
- ✅ Application Management
- ✅ User Permission System
- ✅ Alert Management
- ✅ Dashboard Analytics
- ✅ Audit Logging

## Project Structure

```
src/main/java/com/example/backend/
├── config/
│   ├── GlobalExceptionHandler.java    # Centralized error handling
│   ├── SecurityConfig.java           # Security configuration
│   └── WebConfig.java               # CORS and web configuration
├── controllers/
│   ├── AlertController.java         # Alert management endpoints
│   ├── ApplicationController.java   # Application CRUD operations
│   ├── AuthController.java         # Authentication endpoints
│   ├── DashboardController.java    # Dashboard analytics
│   ├── LogController.java          # Log management endpoints
│   ├── PermissionController.java   # Permission assignment
│   └── UserController.java         # User management
├── dtos/
│   ├── AlertDTO.java              # Alert data transfer objects
│   ├── ApplicationDTO.java        # Application DTOs
│   ├── AssignPermissionRequest.java # Permission assignment request
│   ├── BulkRevokeRequest.java     # Bulk permission revocation
│   ├── DashboardStatsDTO.java     # Dashboard statistics
│   ├── LogDTO.java                # Log data transfer objects
│   ├── LevelCountDTO.java         # Log level count statistics
│   ├── TrendBucketDTO.java        # Time-series trend data
│   └── UserInfo.java              # User information DTO
├── entities/
│   ├── Alert.java                 # Alert entity
│   ├── Application.java           # Application entity
│   ├── Logs.java                  # Log entry entity
│   ├── Permission.java            # User-Application permission
│   ├── Role.java                  # User role enumeration
│   └── User.java                  # User entity
├── repositories/
│   ├── AlertRepository.java       # Alert data access
│   ├── ApplicationRepository.java # Application data access
│   ├── LogRepository.java         # Log data access with custom queries
│   ├── PermissionRepository.java  # Permission data access
│   └── UserRepository.java        # User data access
├── security/
│   └── AuthorizationService.java  # Authorization utilities
└── services/
    ├── AlertService.java          # Alert business logic
    ├── ApplicationService.java    # Application business logic
    ├── AuthService.java           # Authentication business logic
    ├── DashboardService.java      # Dashboard analytics logic
    ├── LogService.java            # Log management business logic
    └── PermissionService.java     # Permission management logic
```

## Error Handling System

### Global Exception Handler

The application implements comprehensive error handling through `GlobalExceptionHandler.java`:

#### Exception Types Handled:

1. **ValidationException** → 400 Bad Request
   - Handles `@Valid` annotation failures
   - Returns field-specific error messages

2. **IllegalArgumentException** → 400 Bad Request
   - Invalid input parameters
   - Business logic validation failures

3. **AccessDeniedException** → 403 Forbidden
   - Authorization failures
   - Role-based access violations

4. **NoSuchElementException** → 404 Not Found
   - Resource not found errors
   - Entity lookup failures

5. **Exception** → 500 Internal Server Error
   - Unexpected system errors
   - Fallback error handling

#### Error Response Format:
```json
{
    "timestamp": "2024-01-01T10:00:00",
    "status": 400,
    "error": "Invalid Argument",
    "message": "Detailed error description"
}
```

### Service-Level Error Handling

All service classes implement comprehensive error handling:

- **Input Validation**: Null checks, empty collection validation
- **Entity Existence**: Verification of referenced entities
- **Business Logic Validation**: Domain-specific rule enforcement
- **Detailed Logging**: Debug, info, warn, and error logs with context
- **Exception Propagation**: Proper exception re-throwing for global handler

## Authentication & Authorization

### OAuth2 Google Integration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    // OAuth2 configuration with Google provider
    // JWT token handling
    // Role-based method security
}
```

### Role System

- **ADMIN**: Full system access, user management, permission assignment
- **USER**: Limited access based on assigned application permissions

### Authorization Service

```java
@Service
public class AuthorizationService {
    public boolean isAdmin();
    public boolean canViewLogs(Long userId, Long appId);
    public boolean canManageApp(Long userId, Long appId);
}
```

## API Endpoints

### Authentication Endpoints
- `POST /auth/login` - OAuth2 login initiation
- `POST /auth/logout` - User logout
- `GET /auth/user` - Get current user info

### User Management
- `GET /users` - List all users (Admin only)
- `POST /users` - Create user (Admin only)
- `PUT /users/{id}` - Update user (Admin only)
- `DELETE /users/{id}` - Delete user (Admin only)

### Application Management
- `GET /applications` - List applications
- `POST /applications` - Create application (Admin only)
- `PUT /applications/{id}` - Update application
- `DELETE /applications/{id}` - Delete application (Admin only)

### Log Management
- `GET /logs/search` - Search logs with filters
- `GET /logs/trends` - Get log trends over time
- `GET /logs/summary` - Get log level summary

### Permission Management
- `POST /permissions` - Assign users to applications (Admin only)
- `DELETE /permissions` - Revoke user permissions (Admin only)

### Alert Management
- `GET /alerts` - List alerts
- `POST /alerts` - Create alert
- `PUT /alerts/{id}` - Update alert
- `DELETE /alerts/{id}` - Delete alert

### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics

## Database Schema

### Core Entities

#### User
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Application
```sql
CREATE TABLE applications (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Logs
```sql
CREATE TABLE logs (
    id BIGINT PRIMARY KEY,
    application_id BIGINT,
    level VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    FOREIGN KEY (application_id) REFERENCES applications(id)
);
```

#### Permission
```sql
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    application_id BIGINT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (application_id) REFERENCES applications(id)
);
```

#### Alert
```sql
CREATE TABLE alerts (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    condition_field VARCHAR(255),
    condition_operator VARCHAR(50),
    condition_value VARCHAR(255),
    application_id BIGINT,
    user_id BIGINT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Service Layer Details

### LogService
- **searchLogs()**: Advanced filtering with pagination
- **getLogTrends()**: Time-series analytics with configurable periods
- **getLogSummary()**: Aggregated statistics by log level
- **Error Handling**: Comprehensive validation and logging

### PermissionService
- **assignUsersToApps()**: Bulk permission assignment with validation
- **revokeAssignments()**: Bulk permission revocation
- **Authorization Methods**: Role checking and access validation
- **Error Handling**: Entity existence validation, detailed error messages

### ApplicationService
- **CRUD Operations**: Full application lifecycle management
- **Permission Integration**: Automatic permission cleanup on deletion
- **Error Handling**: Validation and conflict resolution

### AlertService
- **Alert Management**: Create, update, delete alerts
- **Condition Evaluation**: Flexible alert condition system
- **User Association**: Role-based alert access control

## Security Features

### Method-Level Security
```java
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("@authz.canViewLogs(#userId, #appId)")
```

### CORS Configuration
- Configurable allowed origins
- Credential support for OAuth2
- Method and header restrictions

### Input Validation
- `@Valid` annotations on request bodies
- Custom validation logic in services
- Comprehensive error responses

## Logging Strategy

### Log Levels
- **DEBUG**: Method entry/exit, parameter values
- **INFO**: Successful operations, business events
- **WARN**: Authorization failures, missing resources
- **ERROR**: Exception details, system failures

### Log Format
```
[TIMESTAMP] [LEVEL] [CLASS.METHOD] - Message with context
```

## Configuration

### Application Properties
```properties
# Database configuration
spring.datasource.url=jdbc:h2:mem:testdb
spring.jpa.hibernate.ddl-auto=update

# OAuth2 configuration
spring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID}
spring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET}

# CORS configuration
app.cors.allowed-origins=http://localhost:3000

# Logging configuration
logging.level.com.example.backend=DEBUG
```

### Environment Variables
- `GOOGLE_CLIENT_ID`: OAuth2 Google client ID
- `GOOGLE_CLIENT_SECRET`: OAuth2 Google client secret
- `DATABASE_URL`: Database connection string (if not using H2)

## Development Setup

### Prerequisites
- Java 17+
- Maven 3.6+
- Google OAuth2 credentials

### Build & Run
```bash
# Clone repository
git clone <repository-url>

# Navigate to backend directory
cd logging-platform/back-end

# Set environment variables
export GOOGLE_CLIENT_ID=your_client_id
export GOOGLE_CLIENT_SECRET=your_client_secret

# Build application
./mvnw clean compile

# Run application
./mvnw spring-boot:run
```

### Testing
```bash
# Run all tests
./mvnw test

# Run with coverage
./mvnw test jacoco:report
```

## API Usage Examples

### Authentication Flow
```javascript
// Frontend OAuth2 login
window.location.href = '/oauth2/authorization/google';

// After successful login, get user info
fetch('/auth/user', {
    credentials: 'include'
}).then(response => response.json());
```

### Log Search
```javascript
// Search logs with filters
fetch('/logs/search?' + new URLSearchParams({
    page: 0,
    size: 20,
    level: 'ERROR',
    appId: 1,
    startTime: '2024-01-01T00:00:00',
    endTime: '2024-01-02T00:00:00',
    message: 'exception'
}), {
    credentials: 'include'
}).then(response => response.json());
```

### Permission Assignment
```javascript
// Assign users to applications (Admin only)
fetch('/permissions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
        userIds: [1, 2, 3],
        appIds: [1, 2]
    })
}).then(response => response.json());
```

## Error Handling Examples

### Client-Side Error Handling
```javascript
fetch('/api/endpoint')
    .then(response => {
        if (!response.ok) {
            return response.json().then(error => {
                throw new Error(error.message);
            });
        }
        return response.json();
    })
    .catch(error => {
        console.error('API Error:', error.message);
        // Display user-friendly error message
    });
```

### Common Error Scenarios

1. **Invalid User ID**
   ```json
   {
       "timestamp": "2024-01-01T10:00:00",
       "status": 400,
       "error": "Invalid Argument",
       "message": "Users not found with IDs: [999]"
   }
   ```

2. **Unauthorized Access**
   ```json
   {
       "timestamp": "2024-01-01T10:00:00",
       "status": 403,
       "error": "Access Denied",
       "message": "Only administrators can assign permissions"
   }
   ```

3. **Resource Not Found**
   ```json
   {
       "timestamp": "2024-01-01T10:00:00",
       "status": 404,
       "error": "Resource Not Found",
       "message": "Application not found with ID: 999"
   }
   ```

## Performance Considerations

### Database Optimization
- Indexed columns: `timestamp`, `level`, `application_id`
- Pagination for large result sets
- Efficient query design with JPA Specifications

### Caching Strategy
- User role caching for authorization
- Application metadata caching
- Session-based authentication state

### Monitoring
- Comprehensive logging for debugging
- Error tracking and alerting
- Performance metrics collection

## Security Best Practices

### Input Validation
- All user inputs validated
- SQL injection prevention through JPA
- XSS protection via proper encoding

### Authentication
- OAuth2 with Google provider
- Secure session management
- Automatic token refresh

### Authorization
- Role-based access control
- Method-level security annotations
- Resource-level permission checks

## Deployment

### Production Configuration
```properties
# Production database
spring.datasource.url=${DATABASE_URL}
spring.jpa.hibernate.ddl-auto=validate

# Security settings
server.servlet.session.cookie.secure=true
server.servlet.session.cookie.http-only=true

# Logging
logging.level.com.example.backend=INFO
logging.file.name=logs/app.log
```

### Docker Support
```dockerfile
FROM openjdk:17-jdk-slim
COPY target/backend-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

## Recent Enhancements

### Error Handling Improvements (Latest)
- ✅ Enhanced GlobalExceptionHandler with specific exception types
- ✅ Comprehensive service-level error handling in LogService
- ✅ Detailed validation and logging in PermissionService
- ✅ Controller-level error handling with proper HTTP status codes
- ✅ Consistent error response format across all endpoints
- ✅ Detailed error messages for better debugging and user experience

### Key Benefits
- **Improved User Experience**: Clear, actionable error messages
- **Better Debugging**: Comprehensive logging with context
- **Robust Validation**: Input validation at multiple layers
- **Consistent API**: Standardized error response format
- **Security**: Proper handling of authorization failures

## Future Enhancements

### Planned Features
- [ ] Real-time log streaming with WebSockets
- [ ] Advanced alert conditions and notifications
- [ ] Log retention policies and archiving
- [ ] API rate limiting and throttling
- [ ] Metrics and monitoring dashboard
- [ ] Bulk log import/export functionality

### Technical Improvements
- [ ] Redis caching integration
- [ ] Elasticsearch for log search optimization
- [ ] Microservices architecture migration
- [ ] Container orchestration with Kubernetes
- [ ] CI/CD pipeline integration
- [ ] Automated testing and quality gates

---

*This documentation reflects the current state of the centralized logging platform backend with comprehensive error handling and robust security features.*
