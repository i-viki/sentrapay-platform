package dev.jayavignesh.sentrapay.wallet.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class DepositRequest {

    @NotNull(message = "Deposit amount is required")
    @DecimalMin(value = "1.00", message = "Deposit amount must be at least 1.00")
    private BigDecimal amount;

    private String currency = "INR";
    private String source = "BANK_TRANSFER";
    private String referenceUtr;

    public DepositRequest() {}

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getReferenceUtr() { return referenceUtr; }
    public void setReferenceUtr(String referenceUtr) { this.referenceUtr = referenceUtr; }
}

