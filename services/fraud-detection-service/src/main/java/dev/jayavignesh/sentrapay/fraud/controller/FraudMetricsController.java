package dev.jayavignesh.sentrapay.fraud.controller;

import dev.jayavignesh.sentrapay.events.FraudScoredEvent;
import dev.jayavignesh.sentrapay.events.PaymentInitiatedEvent;
import dev.jayavignesh.sentrapay.fraud.service.FraudRuleEngine;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fraud")
public class FraudMetricsController {

    private final FraudRuleEngine fraudRuleEngine;

    public FraudMetricsController(FraudRuleEngine fraudRuleEngine) {
        this.fraudRuleEngine = fraudRuleEngine;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of(
                "service", "fraud-detection-service",
                "status", "ACTIVE",
                "rules", List.of("SLIDING_WINDOW_VELOCITY_ZSET", "ML_RANDOM_FOREST_SIDECAR", "HIGH_TICKET_THRESHOLD")
        ));
    }

    @PostMapping("/evaluate")
    public ResponseEntity<FraudScoredEvent> evaluateRisk(@RequestBody Map<String, Object> payload) {
        String paymentRef = (String) payload.getOrDefault("paymentReference", "TEST-TXN-" + System.currentTimeMillis());
        long senderId = ((Number) payload.getOrDefault("senderWalletId", 1L)).longValue();
        long recipientId = ((Number) payload.getOrDefault("recipientWalletId", 2L)).longValue();
        double amount = ((Number) payload.getOrDefault("amount", 1000.0)).doubleValue();
        String channel = (String) payload.getOrDefault("channel", "UPI");

        PaymentInitiatedEvent event = new PaymentInitiatedEvent(
                paymentRef,
                "IDEM-" + System.currentTimeMillis(),
                senderId,
                recipientId,
                BigDecimal.valueOf(amount),
                "INR",
                channel,
                "127.0.0.1",
                Instant.now()
        );

        FraudScoredEvent scored = fraudRuleEngine.evaluate(event);
        return ResponseEntity.ok(scored);
    }
}
