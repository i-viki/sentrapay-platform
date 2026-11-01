package dev.jayavignesh.sentrapay.wallet.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "balance_holds")
public class BalanceHold {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    @Column(name = "payment_reference", nullable = false, unique = true, length = 64)
    private String paymentReference;

    @Column(name = "hold_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal holdAmount;

    @Column(nullable = false, length = 50)
    private String status = "ACTIVE"; // "ACTIVE", "COMMITTED", "RELEASED"

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public BalanceHold() {}

    public BalanceHold(Wallet wallet, String paymentReference, BigDecimal holdAmount, Instant expiresAt) {
        this.wallet = wallet;
        this.paymentReference = paymentReference;
        this.holdAmount = holdAmount;
        this.expiresAt = expiresAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Wallet getWallet() { return wallet; }
    public void setWallet(Wallet wallet) { this.wallet = wallet; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public BigDecimal getHoldAmount() { return holdAmount; }
    public void setHoldAmount(BigDecimal holdAmount) { this.holdAmount = holdAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}

