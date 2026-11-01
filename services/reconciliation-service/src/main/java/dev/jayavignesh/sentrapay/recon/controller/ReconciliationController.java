package dev.jayavignesh.sentrapay.recon.controller;

import dev.jayavignesh.sentrapay.recon.entity.AuditLog;
import dev.jayavignesh.sentrapay.recon.entity.BankStatement;
import dev.jayavignesh.sentrapay.recon.entity.JournalEntry;
import dev.jayavignesh.sentrapay.recon.repository.BankStatementRepository;
import dev.jayavignesh.sentrapay.recon.service.AuditLogService;
import dev.jayavignesh.sentrapay.recon.service.GeneralLedgerService;
import dev.jayavignesh.sentrapay.recon.service.ReconciliationBatchService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recon")
public class ReconciliationController {

    private final ReconciliationBatchService batchService;
    private final BankStatementRepository bankStatementRepository;
    private final dev.jayavignesh.sentrapay.recon.repository.StatementRecordRepository statementRecordRepository;
    private final GeneralLedgerService generalLedgerService;
    private final AuditLogService auditLogService;

    public ReconciliationController(
            ReconciliationBatchService batchService,
            BankStatementRepository bankStatementRepository,
            dev.jayavignesh.sentrapay.recon.repository.StatementRecordRepository statementRecordRepository,
            GeneralLedgerService generalLedgerService,
            AuditLogService auditLogService
    ) {
        this.batchService = batchService;
        this.bankStatementRepository = bankStatementRepository;
        this.statementRecordRepository = statementRecordRepository;
        this.generalLedgerService = generalLedgerService;
        this.auditLogService = auditLogService;
    }

    @PostMapping("/statements/upload")
    public ResponseEntity<Map<String, Object>> uploadStatement(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "sourceChannel", defaultValue = "HDFC_BANK") String sourceChannel
    ) throws IOException {
        BankStatement statement = batchService.ingestAndReconcile(
                file.getOriginalFilename(),
                sourceChannel,
                file.getBytes()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("statementId", statement.getId());
        response.put("filename", statement.getFilename());
        response.put("fileHashSha256", statement.getFileHashSha256());
        response.put("totalRecords", statement.getTotalRecords());
        response.put("matchedRecords", statement.getMatchedRecords());
        response.put("unmatchedRecords", statement.getUnmatchedRecords());
        response.put("status", statement.getStatus());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/statements")
    public ResponseEntity<List<BankStatement>> getAllStatements() {
        return ResponseEntity.ok(bankStatementRepository.findAll());
    }

    @GetMapping("/statements/{id}")
    public ResponseEntity<BankStatement> getStatementById(@PathVariable Long id) {
        return bankStatementRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/statements/{id}/records")
    public ResponseEntity<List<dev.jayavignesh.sentrapay.recon.entity.StatementRecord>> getStatementRecords(@PathVariable Long id) {
        return ResponseEntity.ok(statementRecordRepository.findByBankStatementId(id));
    }

    @GetMapping("/ledger/trial-balance")
    public ResponseEntity<GeneralLedgerService.TrialBalanceResult> getTrialBalance() {
        return ResponseEntity.ok(generalLedgerService.getTrialBalance());
    }

    @GetMapping("/ledger/entries")
    public ResponseEntity<Page<JournalEntry>> getJournalEntries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(generalLedgerService.getJournalEntries(pageable));
    }

    @GetMapping("/audit")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(auditLogService.getRecentLogs(pageable));
    }

    @GetMapping("/audit/verify")
    public ResponseEntity<AuditLogService.IntegrityVerificationResult> verifyAuditIntegrity() {
        return ResponseEntity.ok(auditLogService.verifyAuditIntegrity());
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        List<BankStatement> statements = bankStatementRepository.findAll();
        int totalIngested = statements.stream().mapToInt(BankStatement::getTotalRecords).sum();
        int totalMatched = statements.stream().mapToInt(BankStatement::getMatchedRecords).sum();
        int totalUnmatched = statements.stream().mapToInt(BankStatement::getUnmatchedRecords).sum();
        double matchRate = totalIngested > 0 ? ((double) totalMatched / totalIngested) * 100.0 : 100.0;

        GeneralLedgerService.TrialBalanceResult trialBalance = generalLedgerService.getTrialBalance();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalStatements", statements.size());
        summary.put("totalRecordsIngested", totalIngested);
        summary.put("matchedRecords", totalMatched);
        summary.put("unmatchedRecords", totalUnmatched);
        summary.put("matchRatePercent", Math.round(matchRate * 100.0) / 100.0);
        summary.put("ledgerBalanced", trialBalance.balanced());
        summary.put("totalDebits", trialBalance.totalDebits());
        summary.put("totalCredits", trialBalance.totalCredits());

        return ResponseEntity.ok(summary);
    }
}

