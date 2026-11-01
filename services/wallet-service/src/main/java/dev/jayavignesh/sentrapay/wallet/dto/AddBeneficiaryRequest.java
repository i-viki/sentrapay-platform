package dev.jayavignesh.sentrapay.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class AddBeneficiaryRequest {

    @NotBlank(message = "Beneficiary name is required")
    private String beneficiaryName;

    @NotBlank(message = "Recipient wallet number is required")
    private String recipientWalletNumber;

    private BigDecimal dailyLimit;

    public AddBeneficiaryRequest() {}

    public String getBeneficiaryName() { return beneficiaryName; }
    public void setBeneficiaryName(String beneficiaryName) { this.beneficiaryName = beneficiaryName; }

    public String getRecipientWalletNumber() { return recipientWalletNumber; }
    public void setRecipientWalletNumber(String recipientWalletNumber) { this.recipientWalletNumber = recipientWalletNumber; }

    public BigDecimal getDailyLimit() { return dailyLimit; }
    public void setDailyLimit(BigDecimal dailyLimit) { this.dailyLimit = dailyLimit; }
}

