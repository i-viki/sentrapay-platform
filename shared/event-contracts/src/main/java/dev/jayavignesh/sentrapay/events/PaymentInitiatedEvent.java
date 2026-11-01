package dev.jayavignesh.sentrapay.events;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Event published to Kafka topic 'payments.initiated' when a user submits a transfer
 * and the wallet service reserves an active balance hold.
 */
public record PaymentInitiatedEvent(
        String paymentReference,
        String idempotencyKey,
        long senderWalletId,
        long recipientWalletId,
        BigDecimal amount,
        String currency,
        String channel,
        String deviceIp,
        Instant initiatedAt
) implements Serializable {}

