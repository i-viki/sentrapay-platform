package dev.jayavignesh.sentrapay.fraud.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalTime;
import java.util.*;

@Service
public class MlInferenceClient {

    private static final Logger log = LoggerFactory.getLogger(MlInferenceClient.class);

    private final RestTemplate restTemplate;
    private final String mlServiceUrl;

    public record MlPredictionResult(
            double fraudProbability,
            String riskTier,
            String action,
            long inferenceTimeNanos,
            List<String> flaggedIndicators
    ) {}

    public MlInferenceClient(
            RestTemplateBuilder builder,
            @Value("${ml.http.url:http://ml-inference-service:8000}") String mlServiceUrl
    ) {
        this.mlServiceUrl = mlServiceUrl;
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofMillis(1500))
                .setReadTimeout(Duration.ofMillis(3000))
                .build();
    }

    public MlPredictionResult evaluateRisk(
            String transactionId,
            double amount,
            long velocity1m,
            long velocity1h,
            String paymentChannel
    ) {
        long startNanos = System.nanoTime();
        String targetUrl = mlServiceUrl + "/predict";

        Map<String, Object> requestPayload = new HashMap<>();
        requestPayload.put("transaction_id", transactionId);
        requestPayload.put("amount", amount);
        requestPayload.put("velocity_last_1min", velocity1m);
        requestPayload.put("velocity_last_1hour", velocity1h);
        requestPayload.put("payment_channel", paymentChannel);
        requestPayload.put("hour_of_day", LocalTime.now().getHour());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(targetUrl, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> body = (Map<String, Object>) response.getBody();
                
                Object probVal = body.get("fraud_probability");
                double prob = probVal instanceof Number ? ((Number) probVal).doubleValue() : 0.05;

                String riskTier = body.get("risk_tier") != null ? body.get("risk_tier").toString() : "LOW";
                String action = body.get("action") != null ? body.get("action").toString() : "APPROVE";

                Object elapsedVal = body.get("inference_time_nanos");
                long elapsed = elapsedVal instanceof Number ? ((Number) elapsedVal).longValue() : (System.nanoTime() - startNanos);

                @SuppressWarnings("unchecked")
                List<String> flags = (List<String>) body.get("flagged_indicators");
                if (flags == null) {
                    flags = new ArrayList<>();
                }

                log.info("ML sidecar scored tx {}: prob={}, tier={}, action={} in {} ns",
                        transactionId, prob, riskTier, action, elapsed);

                return new MlPredictionResult(prob, riskTier, action, elapsed, flags);
            }
        } catch (Exception e) {
            log.warn("ML sidecar call failed ({}), falling back to built-in risk evaluation: {}", targetUrl, e.getMessage());
        }

        // Resilient fallback rule evaluation when ML container is bootstrapping
        long elapsedNanos = System.nanoTime() - startNanos;
        double fallbackProb = 0.05;
        String fallbackTier = "LOW";
        String fallbackAction = "APPROVE";
        List<String> fallbackFlags = new ArrayList<>();
        fallbackFlags.add("ML_SIDECAR_FALLBACK_APPLIED");

        if (velocity1m > 5) {
            fallbackProb = 0.85;
            fallbackTier = "HIGH";
            fallbackAction = "REJECT";
            fallbackFlags.add("HIGH_VELOCITY_BURST");
        } else if (amount > 100000.0) {
            fallbackProb = 0.45;
            fallbackTier = "MEDIUM";
            fallbackAction = "MANUAL_REVIEW";
            fallbackFlags.add("HIGH_TICKET_TRANSFER");
        }

        return new MlPredictionResult(fallbackProb, fallbackTier, fallbackAction, elapsedNanos, fallbackFlags);
    }
}
