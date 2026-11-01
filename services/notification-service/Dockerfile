FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S sentrapay && adduser -S sentrapay -G sentrapay
USER sentrapay

COPY services/notification-service/target/notification-service-1.0.0.jar app.jar
EXPOSE 8084

ENTRYPOINT ["java", "-XX:+UseZGC", "-XX:MinRAMPercentage=50", "-XX:MaxRAMPercentage=80", "-jar", "app.jar"]
