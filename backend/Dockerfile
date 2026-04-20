# ─────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

# Copy Maven wrapper and pom first (layer-cache dependencies)
COPY mvnw pom.xml ./
COPY .mvn .mvn

RUN chmod +x mvnw && ./mvnw dependency:go-offline -q

# Copy source and build
COPY src ./src
RUN ./mvnw package -DskipTests -q

# ─────────────────────────────────────────────
# Stage 2: Runtime
# ─────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

LABEL maintainer="SwiftEats Team"
LABEL version="2.0"

# Security: run as non-root
RUN addgroup -S swifteats && adduser -S swifteats -G swifteats

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

RUN chown swifteats:swifteats app.jar

USER swifteats

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", \
    "-Xms256m", "-Xmx512m", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
