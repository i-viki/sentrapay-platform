package dev.jayavignesh.sentrapay.recon.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "journal_lines")
public class JournalLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id", nullable = false)
    private JournalEntry journalEntry;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "account_id", nullable = false)
    private LedgerAccount account;

    @Column(name = "entry_type", nullable = false, length = 10)
    private String entryType; // "DEBIT" or "CREDIT"

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(length = 255)
    private String memo;

    public JournalLine() {}

    public JournalLine(LedgerAccount account, String entryType, BigDecimal amount, String memo) {
        this.account = account;
        this.entryType = entryType;
        this.amount = amount;
        this.memo = memo;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public JournalEntry getJournalEntry() { return journalEntry; }
    public void setJournalEntry(JournalEntry journalEntry) { this.journalEntry = journalEntry; }

    public LedgerAccount getAccount() { return account; }
    public void setAccount(LedgerAccount account) { this.account = account; }

    public String getEntryType() { return entryType; }
    public void setEntryType(String entryType) { this.entryType = entryType; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getMemo() { return memo; }
    public void setMemo(String memo) { this.memo = memo; }
}

