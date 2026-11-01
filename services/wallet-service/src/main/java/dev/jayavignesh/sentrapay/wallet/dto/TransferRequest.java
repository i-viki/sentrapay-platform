package dev.jayavignesh.sentrapay.wallet.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class TransferRequest {

    @NotBlank(message = "Recipient wallet number is required")
    private String recipientWalletNumber;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Transfer amount must be at least 1.00")
    private BigDecimal amount;

    private String currency = "INR";
    private String paymentMethod = "UPI";
    private String claimedUtr;
    private String ipAddress;
    private String deviceId;

    public TransferRequest() {}

    public String getRecipientWalletNumber() { return recipientWalletNumber; }
    public void setRecipientWalletNumber(String recipientWalletNumber) { this.recipientWalletNumber = recipientWalletNumber; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getClaimedUtr() { return claimedUtr; }
    public void setClaimedUtr(String claimedUtr) { this.claimedUtr = claimedUtr; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
}

