package dev.jayavignesh.sentrapay.wallet.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class WalletResponse {

    private Long id;
    private String walletNumber;
    private String username;
    private String fullName;
    private String currency;
    private String status;
    private BigDecimal currentBalance;
    private BigDecimal availableBalance;
    private BigDecimal activeHolds;
    private Instant createdAt;

    public WalletResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getWalletNumber() { return walletNumber; }
    public void setWalletNumber(String walletNumber) { this.walletNumber = walletNumber; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getCurrentBalance() { return currentBalance; }
    public void setCurrentBalance(BigDecimal currentBalance) { this.currentBalance = currentBalance; }

    public BigDecimal getAvailableBalance() { return availableBalance; }
    public void setAvailableBalance(BigDecimal availableBalance) { this.availableBalance = availableBalance; }

    public BigDecimal getActiveHolds() { return activeHolds; }
    public void setActiveHolds(BigDecimal activeHolds) { this.activeHolds = activeHolds; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

