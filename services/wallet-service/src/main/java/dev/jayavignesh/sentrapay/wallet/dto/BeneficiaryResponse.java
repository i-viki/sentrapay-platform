package dev.jayavignesh.sentrapay.wallet.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class BeneficiaryResponse {

    private Long id;
    private String beneficiaryName;
    private String recipientWalletNumber;
    private boolean coolingOffActive;
    private long coolingOffRemainingHours;
    private BigDecimal dailyLimit;
    private Instant createdAt;

    public BeneficiaryResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBeneficiaryName() { return beneficiaryName; }
    public void setBeneficiaryName(String beneficiaryName) { this.beneficiaryName = beneficiaryName; }

    public String getRecipientWalletNumber() { return recipientWalletNumber; }
    public void setRecipientWalletNumber(String recipientWalletNumber) { this.recipientWalletNumber = recipientWalletNumber; }

    public boolean isCoolingOffActive() { return coolingOffActive; }
    public void setCoolingOffActive(boolean coolingOffActive) { this.coolingOffActive = coolingOffActive; }

    public long getCoolingOffRemainingHours() { return coolingOffRemainingHours; }
    public void setCoolingOffRemainingHours(long coolingOffRemainingHours) { this.coolingOffRemainingHours = coolingOffRemainingHours; }

    public BigDecimal getDailyLimit() { return dailyLimit; }
    public void setDailyLimit(BigDecimal dailyLimit) { this.dailyLimit = dailyLimit; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

