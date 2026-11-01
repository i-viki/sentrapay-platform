package dev.jayavignesh.sentrapay.events;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Event published to Kafka topic 'payments.fraud-scored' after the Fraud Detection Service
 * completes Redis velocity checks and gRPC Machine Learning inference.
 */
public record FraudScoredEvent(
        String paymentReference,
        long senderWalletId,
        long recipientWalletId,
        BigDecimal amount,
        double fraudProbability,
        String riskTier,        // "LOW", "MEDIUM", "HIGH"
        String verdict,         // "APPROVED", "MANUAL_REVIEW", "REJECTED"
        List<String> flaggedIndicators,
        long inferenceTimeNanos,
        Instant evaluatedAt
) implements Serializable {}

