package dev.jayavignesh.sentrapay.wallet.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payment_requests")
public class PaymentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_reference", nullable = false, unique = true, length = 64)
    private String requestReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_wallet_id", nullable = false)
    private Wallet requesterWallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payer_wallet_id", nullable = false)
    private Wallet payerWallet;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(length = 255)
    private String description;

    @Column(nullable = false, length = 50)
    private String status = "PENDING"; // PENDING, FULFILLED, REJECTED, EXPIRED

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "fulfilled_payment_reference", length = 64)
    private String fulfilledPaymentReference;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public PaymentRequest() {}

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRequestReference() { return requestReference; }
    public void setRequestReference(String requestReference) { this.requestReference = requestReference; }

    public Wallet getRequesterWallet() { return requesterWallet; }
    public void setRequesterWallet(Wallet requesterWallet) { this.requesterWallet = requesterWallet; }

    public Wallet getPayerWallet() { return payerWallet; }
    public void setPayerWallet(Wallet payerWallet) { this.payerWallet = payerWallet; }

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

    public String getFulfilledPaymentReference() { return fulfilledPaymentReference; }
    public void setFulfilledPaymentReference(String fulfilledPaymentReference) { this.fulfilledPaymentReference = fulfilledPaymentReference; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

