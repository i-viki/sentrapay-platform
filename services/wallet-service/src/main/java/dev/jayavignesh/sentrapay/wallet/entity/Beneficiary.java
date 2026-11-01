package dev.jayavignesh.sentrapay.wallet.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "beneficiaries")
public class Beneficiary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "beneficiary_name", nullable = false, length = 100)
    private String beneficiaryName;

    @Column(name = "recipient_wallet_number", nullable = false, length = 64)
    private String recipientWalletNumber;

    @Column(name = "cooling_off_until", nullable = false)
    private Instant coolingOffUntil;

    @Column(name = "daily_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal dailyLimit = new BigDecimal("50000.00");

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Beneficiary() {}

    public Beneficiary(User user, String beneficiaryName, String recipientWalletNumber, Instant coolingOffUntil, BigDecimal dailyLimit) {
        this.user = user;
        this.beneficiaryName = beneficiaryName;
        this.recipientWalletNumber = recipientWalletNumber;
        this.coolingOffUntil = coolingOffUntil;
        this.dailyLimit = dailyLimit != null ? dailyLimit : new BigDecimal("50000.00");
        this.createdAt = Instant.now();
    }

    public boolean isCoolingOffActive() {
        return coolingOffUntil != null && Instant.now().isBefore(coolingOffUntil);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getBeneficiaryName() { return beneficiaryName; }
    public void setBeneficiaryName(String beneficiaryName) { this.beneficiaryName = beneficiaryName; }

    public String getRecipientWalletNumber() { return recipientWalletNumber; }
    public void setRecipientWalletNumber(String recipientWalletNumber) { this.recipientWalletNumber = recipientWalletNumber; }

    public Instant getCoolingOffUntil() { return coolingOffUntil; }
    public void setCoolingOffUntil(Instant coolingOffUntil) { this.coolingOffUntil = coolingOffUntil; }

    public BigDecimal getDailyLimit() { return dailyLimit; }
    public void setDailyLimit(BigDecimal dailyLimit) { this.dailyLimit = dailyLimit; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

