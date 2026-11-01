package dev.jayavignesh.sentrapay.recon.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_reference", nullable = false, unique = true, length = 64)
    private String paymentReference;

    @Column(name = "sender_wallet_id", nullable = false)
    private Long senderWalletId;

    @Column(name = "recipient_wallet_id", nullable = false)
    private Long recipientWalletId;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(name = "payment_channel", nullable = false, length = 50)
    private String paymentChannel;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "claimed_utr", length = 100)
    private String claimedUtr;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Transaction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public Long getSenderWalletId() { return senderWalletId; }
    public void setSenderWalletId(Long senderWalletId) { this.senderWalletId = senderWalletId; }

    public Long getRecipientWalletId() { return recipientWalletId; }
    public void setRecipientWalletId(Long recipientWalletId) { this.recipientWalletId = recipientWalletId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getPaymentChannel() { return paymentChannel; }
    public void setPaymentChannel(String paymentChannel) { this.paymentChannel = paymentChannel; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getClaimedUtr() { return claimedUtr; }
    public void setClaimedUtr(String claimedUtr) { this.claimedUtr = claimedUtr; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

