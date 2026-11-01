package dev.jayavignesh.sentrapay.recon.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "statement_records")
public class StatementRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "statement_id", nullable = false)
    private BankStatement bankStatement;

    @Column(name = "utr_number", nullable = false, length = 100)
    private String utrNumber;

    @Column(name = "transaction_date", nullable = false)
    private Instant transactionDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "payer_vpa", length = 100)
    private String payerVpa;

    @Column(name = "is_reconciled", nullable = false)
    private boolean reconciled = false;

    @Column(name = "match_type", length = 50)
    private String matchType = "UNMATCHED";

    @Column(name = "confidence_score", precision = 5, scale = 2)
    private BigDecimal confidenceScore = BigDecimal.ZERO;

    @Column(name = "discrepancy_reason", length = 255)
    private String discrepancyReason;

    @Column(name = "reconciled_transaction_id")
    private Long reconciledTransactionId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public StatementRecord() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BankStatement getBankStatement() { return bankStatement; }
    public void setBankStatement(BankStatement bankStatement) { this.bankStatement = bankStatement; }

    public String getUtrNumber() { return utrNumber; }
    public void setUtrNumber(String utrNumber) { this.utrNumber = utrNumber; }

    public Instant getTransactionDate() { return transactionDate; }
    public void setTransactionDate(Instant transactionDate) { this.transactionDate = transactionDate; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPayerVpa() { return payerVpa; }
    public void setPayerVpa(String payerVpa) { this.payerVpa = payerVpa; }

    public boolean isReconciled() { return reconciled; }
    public void setReconciled(boolean reconciled) { this.reconciled = reconciled; }

    public String getMatchType() { return matchType; }
    public void setMatchType(String matchType) { this.matchType = matchType; }

    public BigDecimal getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(BigDecimal confidenceScore) { this.confidenceScore = confidenceScore; }

    public String getDiscrepancyReason() { return discrepancyReason; }
    public void setDiscrepancyReason(String discrepancyReason) { this.discrepancyReason = discrepancyReason; }

    public Long getReconciledTransactionId() { return reconciledTransactionId; }
    public void setReconciledTransactionId(Long reconciledTransactionId) { this.reconciledTransactionId = reconciledTransactionId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

