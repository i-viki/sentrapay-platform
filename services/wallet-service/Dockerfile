FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S sentrapay && adduser -S sentrapay -G sentrapay
USER sentrapay

COPY services/wallet-service/target/wallet-service-1.0.0.jar app.jar
EXPOSE 8081

ENTRYPOINT ["java", "-XX:+UseZGC", "-XX:MinRAMPercentage=50", "-XX:MaxRAMPercentage=80", "-jar", "app.jar"]
