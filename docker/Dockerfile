FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src src

# Build the application
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install curl for health checks and wget for downloading OpenTelemetry agent
RUN apk add --no-cache curl wget

# Download OpenTelemetry Java agent
RUN wget -O /app/opentelemetry-javaagent.jar \
    https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.1.0/opentelemetry-javaagent.jar

# Copy the built artifact from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Create logs directory
RUN mkdir -p /app/logs

# Expose application port
EXPOSE 8080

# Run the application with OpenTelemetry agent
ENTRYPOINT ["java", \
    "-javaagent:/app/opentelemetry-javaagent.jar", \
    "-Dotel.service.name=observability-backend", \
    "-Dotel.traces.exporter=otlp", \
    "-Dotel.metrics.exporter=otlp", \
    "-Dotel.logs.exporter=none", \
    "-Dotel.exporter.otlp.endpoint=http://otel-collector:4317", \
    "-Dotel.exporter.otlp.protocol=grpc", \
    "-Dotel.instrumentation.common.default-enabled=true", \
    "-Dotel.instrumentation.spring-webmvc.enabled=true", \
    "-Dotel.instrumentation.spring-web.enabled=true", \
    "-Dotel.instrumentation.mongo.enabled=true", \
    "-Dotel.instrumentation.kafka.enabled=true", \
    "-jar", "app.jar"]
