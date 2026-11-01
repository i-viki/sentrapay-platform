package dev.jayavignesh.sentrapay.wallet.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class PaymentRequestResponse {

    private Long id;
    private String requestReference;
    private String requesterWalletNumber;
    private String requesterName;
    private String payerWalletNumber;
    private String payerName;
    private BigDecimal amount;
    private String currency;
    private String description;
    private String status;
    private Instant expiresAt;
    private boolean expired;
    private String fulfilledPaymentReference;
    private Instant createdAt;

    public PaymentRequestResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRequestReference() { return requestReference; }
    public void setRequestReference(String requestReference) { this.requestReference = requestReference; }

    public String getRequesterWalletNumber() { return requesterWalletNumber; }
    public void setRequesterWalletNumber(String requesterWalletNumber) { this.requesterWalletNumber = requesterWalletNumber; }

    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }

    public String getPayerWalletNumber() { return payerWalletNumber; }
    public void setPayerWalletNumber(String payerWalletNumber) { this.payerWalletNumber = payerWalletNumber; }

    public String getPayerName() { return payerName; }
    public void setPayerName(String payerName) { this.payerName = payerName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public boolean isExpired() { return expired; }
    public void setExpired(boolean expired) { this.expired = expired; }

    public String getFulfilledPaymentReference() { return fulfilledPaymentReference; }
    public void setFulfilledPaymentReference(String fulfilledPaymentReference) { this.fulfilledPaymentReference = fulfilledPaymentReference; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

