package dev.jayavignesh.sentrapay.wallet.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class CreatePaymentRequestDto {

    @NotBlank(message = "Payer wallet number is required")
    private String payerWalletNumber;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Amount must be at least 1.00")
    private BigDecimal amount;

    private String currency = "INR";
    private String description;
    private Integer expiryMinutes = 1440; // Default 24 hours

    public CreatePaymentRequestDto() {}

    public String getPayerWalletNumber() { return payerWalletNumber; }
    public void setPayerWalletNumber(String payerWalletNumber) { this.payerWalletNumber = payerWalletNumber; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getExpiryMinutes() { return expiryMinutes; }
    public void setExpiryMinutes(Integer expiryMinutes) { this.expiryMinutes = expiryMinutes; }
}

