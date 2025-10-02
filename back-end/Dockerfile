# Build stage with Java 21 (latest available)
FROM maven:3.9.5-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy Maven files first for better caching
COPY pom.xml .
COPY src ./src

# Build the application with Java 21
RUN mvn clean package -DskipTests

# Runtime stage with Java 21
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "app.jar"]
