# Distributed Tracing Setup Guide

## Overview
This application uses **Micrometer Tracing with Brave** for distributed tracing in Spring Boot 3.x.
Trace IDs are automatically generated and added to all logs.

## What Was Configured

### 1. Dependencies (pom.xml)
- `micrometer-tracing-bridge-brave` - Core tracing library
- `micrometer-tracing` - Micrometer tracing API
- `log4j-to-slf4j` - Bridge for MDC support with Log4j2
- `slf4j-api` - SLF4J API

### 2. Configuration Files

#### application.yml
```yaml
management:
  tracing:
    sampling:
      probability: 1.0  # 100% sampling (all requests are traced)
```

#### log4j2-spring.xml
```xml
<PatternLayout pattern="[%d{yyyy-MM-dd HH:mm:ss.SSS}] [%p] [%X{traceId:-N/A}] %m%n" />
```

### 3. TraceIdFilter (TracingConfig.java)
A custom filter that bridges Micrometer's trace IDs to Log4j2's ThreadContext.
This ensures `%X{traceId}` works in Log4j2 patterns.

## Environment Variables Required

Make sure your `.env` file contains:
```bash
APP_NAME=logging-platform
APP_VERSION=1.0.0
SPRING_PROFILES_ACTIVE=dev

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:19092

# Company
COMPANY_ADMIN_EMAIL=devops@gosaas.io

# Frontend
FRONTEND_URL=http://localhost:8000
```

## Testing the Setup

### Step 1: Clean and Rebuild
```bash
./mvnw clean install
```

### Step 2: Run the Application
```bash
./mvnw spring-boot:run
```

### Step 3: Test Tracing Endpoint
```bash
curl http://localhost:8080/test-tracing
```

Expected response:
```json
{
  "status": "success",
  "traceId": "64f8c8b1d4e5f6a1a2b3c4d5e6f7a8b1",
  "spanId": "a1b2c3d4e5f6a7b8",
  "message": "Check your logs - you should see this trace ID: 64f8c8b1d4e5f6a1a2b3c4d5e6f7a8b1"
}
```

### Step 4: Check Logs
You should see output like:
```
[2023-10-01 12:30:45.123] [INFO] [64f8c8b1d4e5f6a1a2b3c4d5e6f7a8b1] Testing trace ID with SLF4J logger
[2023-10-01 12:30:45.124] [INFO] [64f8c8b1d4e5f6a1a2b3c4d5e6f7a8b1] Testing trace ID with Log4j2 logger
```

## How It Works

1. **Request Arrives**: Micrometer automatically creates a new span with a unique trace ID
2. **Filter Intercepts**: `TraceIdFilter` extracts the trace ID from Micrometer's Tracer
3. **ThreadContext Updated**: Trace ID is added to Log4j2's ThreadContext
4. **Logging**: All log statements include the trace ID via `%X{traceId}`
5. **Response Sent**: Trace ID is added to response header as `X-Trace-Id`
6. **Cleanup**: ThreadContext is cleared after request completes

## Log Pattern Format

Your log pattern follows the required format:
```
[%d] [%p] [%X{traceId}] %m%n
```

- `[%d]` - Date/time: `[2023-10-01 12:30:45.123]`
- `[%p]` - Log level: `[INFO]`, `[ERROR]`, etc.
- `[%X{traceId}]` - Trace ID from context: `[64f8c8b1d4e5f6a1a2b3c4d5e6f7a8b1]` or `[N/A]` if not available
- `%m` - Log message
- `%n` - New line

## Troubleshooting

### Issue: Trace ID shows as "N/A"
**Solution**: 
1. Verify dependencies are installed: `./mvnw dependency:tree | grep micrometer`
2. Check if `TraceIdFilter` is being loaded: Look for "TraceIdFilter" in startup logs
3. Ensure `management.tracing.sampling.probability=1.0` is set

### Issue: Application won't start
**Solution**:
1. Check all environment variables in `.env` are set
2. Run: `./mvnw clean install` to rebuild
3. Check for dependency conflicts

### Issue: Logs don't show trace IDs in async operations
**Solution**: Micrometer automatically propagates context to async operations.
Make sure you're using Spring's `@Async` annotation.

## Additional Features

### Accessing Trace ID in Code
```java
@Autowired
private Tracer tracer;

public void someMethod() {
    String traceId = tracer.currentSpan().context().traceId();
    // Use trace ID as needed
}
```

### Adding Custom Tags to Spans
```java
var span = tracer.currentSpan();
if (span != null) {
    span.tag("custom.key", "value");
}
```

### Propagation Across Services
Trace IDs are automatically propagated via HTTP headers when using:
- RestTemplate (with auto-configuration)
- WebClient (with auto-configuration)
- Feign clients (with auto-configuration)

## Production Considerations

1. **Sampling Rate**: In production, consider reducing sampling:
   ```yaml
   management:
     tracing:
       sampling:
         probability: 0.1  # 10% of requests
   ```

2. **Export to Zipkin/Jaeger**: Add Zipkin reporter dependency to export traces:
   ```xml
   <dependency>
       <groupId>io.zipkin.reporter2</groupId>
       <artifactId>zipkin-reporter-brave</artifactId>
   </dependency>
   ```

3. **Performance**: Tracing has minimal overhead (~1-2% CPU), but watch for impacts at high load

## References
- [Micrometer Tracing Documentation](https://micrometer.io/docs/tracing)
- [Spring Boot 3 Observability](https://spring.io/blog/2022/10/12/observability-with-spring-boot-3)
- [Brave Tracing](https://github.com/openzipkin/brave)
