package dev.jayavignesh.sentrapay.wallet.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class TransactionResponse {

    private Long id;
    private String paymentReference;
    private String idempotencyKey;
    private String senderWalletNumber;
    private String recipientWalletNumber;
    private BigDecimal amount;
    private String currency;
    private String paymentChannel;
    private String status;
    private BigDecimal riskScore;
    private String riskTier;
    private String claimedUtr;
    private String failureReason;
    private Instant createdAt;

    public TransactionResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getSenderWalletNumber() { return senderWalletNumber; }
    public void setSenderWalletNumber(String senderWalletNumber) { this.senderWalletNumber = senderWalletNumber; }

    public String getRecipientWalletNumber() { return recipientWalletNumber; }
    public void setRecipientWalletNumber(String recipientWalletNumber) { this.recipientWalletNumber = recipientWalletNumber; }

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
}

