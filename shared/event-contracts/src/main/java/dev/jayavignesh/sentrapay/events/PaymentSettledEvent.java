package dev.jayavignesh.sentrapay.events;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Event published to Kafka topic 'payments.settled' once the Wallet Service
 * commits funds (or executes compensating release upon rejection).
 */
public record PaymentSettledEvent(
        String paymentReference,
        long senderWalletId,
        long recipientWalletId,
        BigDecimal amount,
        String currency,
        String status,          // "SETTLED", "FAILED", "MANUAL_REVIEW"
        String failureReason,
        Instant settledAt
) implements Serializable {}

