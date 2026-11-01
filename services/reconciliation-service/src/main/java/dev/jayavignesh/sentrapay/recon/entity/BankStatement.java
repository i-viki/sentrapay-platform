package dev.jayavignesh.sentrapay.recon.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bank_statements")
public class BankStatement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    @Column(name = "file_hash_sha256", nullable = false, unique = true, length = 64)
    private String fileHashSha256;

    @Column(name = "source_channel", nullable = false, length = 50)
    private String sourceChannel;

    @Column(name = "total_records", nullable = false)
    private int totalRecords = 0;

    @Column(name = "matched_records", nullable = false)
    private int matchedRecords = 0;

    @Column(name = "unmatched_records", nullable = false)
    private int unmatchedRecords = 0;

    @Column(nullable = false, length = 50)
    private String status = "PROCESSING";

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt = Instant.now();

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "bankStatement", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StatementRecord> records = new ArrayList<>();

    public BankStatement() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getFileHashSha256() { return fileHashSha256; }
    public void setFileHashSha256(String fileHashSha256) { this.fileHashSha256 = fileHashSha256; }

    public String getSourceChannel() { return sourceChannel; }
    public void setSourceChannel(String sourceChannel) { this.sourceChannel = sourceChannel; }

    public int getTotalRecords() { return totalRecords; }
    public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }

    public int getMatchedRecords() { return matchedRecords; }
    public void setMatchedRecords(int matchedRecords) { this.matchedRecords = matchedRecords; }

    public int getUnmatchedRecords() { return unmatchedRecords; }
    public void setUnmatchedRecords(int unmatchedRecords) { this.unmatchedRecords = unmatchedRecords; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(Instant uploadedAt) { this.uploadedAt = uploadedAt; }

    public List<StatementRecord> getRecords() { return records; }
    public void setRecords(List<StatementRecord> records) { this.records = records; }
}

