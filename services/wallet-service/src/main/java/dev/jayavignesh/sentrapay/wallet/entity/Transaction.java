package dev.jayavignesh.sentrapay.wallet.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_reference", nullable = false, unique = true, length = 64)
    private String paymentReference;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 64)
    private String idempotencyKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_wallet_id", nullable = false)
    private Wallet senderWallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_wallet_id", nullable = false)
    private Wallet recipientWallet;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(name = "payment_channel", nullable = false, length = 50)
    private String paymentChannel = "WALLET_TRANSFER";

    @Column(nullable = false, length = 50)
    private String status = "INITIATED"; // "INITIATED", "HOLD_APPLIED", "SETTLED", "FAILED", "MANUAL_REVIEW"

    @Column(name = "risk_score", precision = 5, scale = 4)
    private BigDecimal riskScore;

    @Column(name = "risk_tier", length = 20)
    private String riskTier;

    @Column(name = "claimed_utr", length = 100)
    private String claimedUtr;

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Transaction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public Wallet getSenderWallet() { return senderWallet; }
    public void setSenderWallet(Wallet senderWallet) { this.senderWallet = senderWallet; }

    public Wallet getRecipientWallet() { return recipientWallet; }
    public void setRecipientWallet(Wallet recipientWallet) { this.recipientWallet = recipientWallet; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPaymentChannel() { return paymentChannel; }
    public void setPaymentChannel(String paymentChannel) { this.paymentChannel = paymentChannel; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getRiskScore() { return riskScore; }
    public void setRiskScore(BigDecimal riskScore) { this.riskScore = riskScore; }

    public String getRiskTier() { return riskTier; }
    public void setRiskTier(String riskTier) { this.riskTier = riskTier; }

    public String getClaimedUtr() { return claimedUtr; }
    public void setClaimedUtr(String claimedUtr) { this.claimedUtr = claimedUtr; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

