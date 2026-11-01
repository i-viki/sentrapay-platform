package dev.jayavignesh.sentrapay.events;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Event published to Kafka topic 'reconciliation.events' when the Spring Batch
 * reconciliation job processes a bank settlement UTR and matches it to a ledger entry.
 */
public record ReconMatchedEvent(
        long statementRecordId,
        String paymentReference,
        String utrNumber,
        BigDecimal amount,
        String matchType,       // "EXACT_MATCH", "FUZZY_MATCH", "UNMATCHED_SUSPENSE", "AMOUNT_DISCREPANCY"
        String remarks,
        Instant matchedAt
) implements Serializable {}

