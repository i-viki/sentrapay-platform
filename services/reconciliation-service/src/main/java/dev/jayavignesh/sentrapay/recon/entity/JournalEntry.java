package dev.jayavignesh.sentrapay.recon.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "journal_entries")
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entry_number", nullable = false, unique = true, length = 64)
    private String entryNumber;

    @Column(name = "transaction_id", nullable = false)
    private Long transactionId;

    @Column(nullable = false)
    private String description;

    @Column(name = "total_debit", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalDebit;

    @Column(name = "total_credit", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalCredit;

    @OneToMany(mappedBy = "journalEntry", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<JournalLine> lines = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public JournalEntry() {}

    public void addLine(JournalLine line) {
        lines.add(line);
        line.setJournalEntry(this);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEntryNumber() { return entryNumber; }
    public void setEntryNumber(String entryNumber) { this.entryNumber = entryNumber; }

    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getTotalDebit() { return totalDebit; }
    public void setTotalDebit(BigDecimal totalDebit) { this.totalDebit = totalDebit; }

    public BigDecimal getTotalCredit() { return totalCredit; }
    public void setTotalCredit(BigDecimal totalCredit) { this.totalCredit = totalCredit; }

    public List<JournalLine> lines() { return lines; }
    public List<JournalLine> getLines() { return lines; }
    public void setLines(List<JournalLine> lines) { this.lines = lines; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

