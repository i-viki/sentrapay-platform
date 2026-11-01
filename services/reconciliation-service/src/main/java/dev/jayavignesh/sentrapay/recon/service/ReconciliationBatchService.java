package dev.jayavignesh.sentrapay.recon.service;

import dev.jayavignesh.sentrapay.events.ReconMatchedEvent;
import dev.jayavignesh.sentrapay.recon.entity.BankStatement;
import dev.jayavignesh.sentrapay.recon.entity.StatementRecord;
import dev.jayavignesh.sentrapay.recon.entity.Transaction;
import dev.jayavignesh.sentrapay.recon.repository.BankStatementRepository;
import dev.jayavignesh.sentrapay.recon.repository.ReconTransactionRepository;
import dev.jayavignesh.sentrapay.recon.repository.StatementRecordRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Service
public class ReconciliationBatchService {

    private static final Logger log = LoggerFactory.getLogger(ReconciliationBatchService.class);
    private static final String TOPIC_RECON_MATCHED = "recon.matched";

    private final BankStatementRepository bankStatementRepository;
    private final StatementRecordRepository statementRecordRepository;
    private final ReconTransactionRepository transactionRepository;
    private final AuditLogService auditLogService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final FuzzyMatcher fuzzyMatcher;

    public ReconciliationBatchService(
            BankStatementRepository bankStatementRepository,
            StatementRecordRepository statementRecordRepository,
            ReconTransactionRepository transactionRepository,
            AuditLogService auditLogService,
            KafkaTemplate<String, Object> kafkaTemplate,
            FuzzyMatcher fuzzyMatcher
    ) {
        this.bankStatementRepository = bankStatementRepository;
        this.statementRecordRepository = statementRecordRepository;
        this.transactionRepository = transactionRepository;
        this.auditLogService = auditLogService;
        this.kafkaTemplate = kafkaTemplate;
        this.fuzzyMatcher = fuzzyMatcher;
    }

    @Transactional
    public BankStatement ingestAndReconcile(String filename, String sourceChannel, byte[] fileBytes) {
        // 1. Checksum generation
        String fileHash = computeSha256(fileBytes);
        Optional<BankStatement> existing = bankStatementRepository.findByFileHashSha256(fileHash);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Bank statement with identical SHA-256 hash has already been ingested: " + fileHash);
        }

        BankStatement statement = new BankStatement();
        statement.setFilename(filename);
        statement.setFileHashSha256(fileHash);
        statement.setSourceChannel(sourceChannel != null ? sourceChannel : "HDFC_BANK");
        statement.setStatus("PROCESSING");
        statement.setUploadedAt(Instant.now());
        statement = bankStatementRepository.save(statement);

        List<StatementRecord> records = new ArrayList<>();
        int matchedCount = 0;
        int unmatchedCount = 0;

        List<Transaction> candidates = transactionRepository.findTop100ByClaimedUtrIsNotNullOrderByCreatedAtDesc();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new java.io.ByteArrayInputStream(fileBytes), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreHeaderCase(true)
                     .setCommentMarker('#')
                     .setIgnoreEmptyLines(true)
                     .setTrim(true)
                     .build())) {

            for (CSVRecord csvRecord : csvParser) {
                if (csvRecord.size() < 2) {
                    continue;
                }
                String utr = csvRecord.isMapped("utr_number") ? csvRecord.get("utr_number") : csvRecord.get(0);
                String amountStr = csvRecord.isMapped("amount") ? csvRecord.get("amount") : csvRecord.get(1);

                if (utr == null || utr.isBlank() || amountStr == null || amountStr.isBlank()) {
                    continue;
                }

                String payerVpa = csvRecord.isMapped("payer_vpa") ? csvRecord.get("payer_vpa") : null;

                BigDecimal amount;
                try {
                    amount = new BigDecimal(amountStr.trim());
                } catch (Exception ex) {
                    log.warn("Skipping invalid amount value in CSV record: {}", amountStr);
                    continue;
                }
                StatementRecord record = new StatementRecord();
                record.setBankStatement(statement);
                record.setUtrNumber(utr);
                record.setAmount(amount);
                record.setPayerVpa(payerVpa);
                record.setTransactionDate(Instant.now());

                // 2. Automated Multi-Tier Settlement Matching (Exact + Fuzzy + Tolerance)
                FuzzyMatcher.MatchResult matchResult = fuzzyMatcher.evaluateMatch(utr, amount, candidates);

                if (matchResult.isMatched()) {
                    Transaction tx = matchResult.transaction();
                    record.setReconciled(true);
                    record.setReconciledTransactionId(tx.getId());
                    record.setMatchType(matchResult.matchType());
                    record.setConfidenceScore(matchResult.confidenceScore());
                    record.setDiscrepancyReason(matchResult.reason());
                    matchedCount++;

                    // Publish ReconMatchedEvent
                    ReconMatchedEvent event = new ReconMatchedEvent(
                            statement.getId(),
                            tx.getPaymentReference(),
                            record.getUtrNumber(),
                            amount,
                            matchResult.matchType(),
                            matchResult.reason(),
                            Instant.now()
                    );
                    kafkaTemplate.send(TOPIC_RECON_MATCHED, tx.getPaymentReference(), event);
                } else {
                    record.setReconciled(false);
                    record.setMatchType("UNMATCHED");
                    record.setConfidenceScore(BigDecimal.ZERO);
                    record.setDiscrepancyReason(matchResult.reason());
                    unmatchedCount++;
                }

                records.add(record);
            }

            statementRecordRepository.saveAll(records);

            statement.setTotalRecords(records.size());
            statement.setMatchedRecords(matchedCount);
            statement.setUnmatchedRecords(unmatchedCount);
            statement.setStatus("COMPLETED");
            BankStatement updated = bankStatementRepository.save(statement);

            auditLogService.append(
                    "STATEMENT_RECONCILED",
                    "BANK_STATEMENT",
                    String.valueOf(updated.getId()),
                    null,
                    "127.0.0.1",
                    String.format("{\"filename\":\"%s\",\"total\":%d,\"matched\":%d,\"unmatched\":%d}",
                            filename, records.size(), matchedCount, unmatchedCount)
            );

            log.info("Ingested statement {} (hash={}): total={}, matched={}, unmatched={}",
                    filename, fileHash, records.size(), matchedCount, unmatchedCount);

            return updated;

        } catch (Exception e) {
            log.error("Failed to parse statement CSV: {}", e.getMessage(), e);
            statement.setStatus("FAILED");
            bankStatementRepository.save(statement);
            throw new RuntimeException("CSV Parsing error: " + e.getMessage(), e);
        }
    }

    private String computeSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(data));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
