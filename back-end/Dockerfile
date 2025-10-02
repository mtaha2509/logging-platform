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

