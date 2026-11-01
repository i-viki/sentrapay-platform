package dev.jayavignesh.sentrapay.recon.service;

import dev.jayavignesh.sentrapay.recon.entity.AuditLog;
import dev.jayavignesh.sentrapay.recon.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);
    private static final String GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

    private final AuditLogRepository auditLogRepository;

    public record IntegrityVerificationResult(boolean valid, int totalRecordsChecked, String failureMessage) {}

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public AuditLog append(String actionType, String entityName, String entityId, Long performedBy, String ipAddress, String payloadJson) {
        String previousHash = auditLogRepository.findLatestRecord()
                .map(AuditLog::getRecordHash)
                .orElse(GENESIS_HASH);

        Instant now = Instant.now();
        String currentHash = computeHash(previousHash, actionType, entityName, entityId, payloadJson, now.toEpochMilli());

        AuditLog entry = new AuditLog();
        entry.setActionType(actionType);
        entry.setEntityName(entityName);
        entry.setEntityId(entityId);
        entry.setPerformedBy(performedBy);
        entry.setIpAddress(ipAddress != null ? ipAddress : "127.0.0.1");
        entry.setLogPayload(payloadJson != null ? payloadJson : "{}");
        entry.setPreviousHash(previousHash);
        entry.setRecordHash(currentHash);

        AuditLog saved = auditLogRepository.save(entry);
        log.info("Appended hash-chained audit record id={}, hash={}", saved.getId(), currentHash);
        return saved;
    }

    @Transactional(readOnly = true)
    public IntegrityVerificationResult verifyAuditIntegrity() {
        List<AuditLog> allLogs = auditLogRepository.findAllByOrderByIdAsc();
        if (allLogs.isEmpty()) {
            return new IntegrityVerificationResult(true, 0, "No audit records present");
        }

        String expectedPrevious = GENESIS_HASH;
        for (int i = 0; i < allLogs.size(); i++) {
            AuditLog logEntry = allLogs.get(i);

            if (!logEntry.getPreviousHash().equals(expectedPrevious)) {
                String error = String.format("Audit chain break at record ID %d: expected previous hash %s but found %s",
                        logEntry.getId(), expectedPrevious, logEntry.getPreviousHash());
                log.error(error);
                return new IntegrityVerificationResult(false, i, error);
            }

            expectedPrevious = logEntry.getRecordHash();
        }

        return new IntegrityVerificationResult(true, allLogs.size(), "Cryptographic audit chain fully verified");
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getRecentLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    private String computeHash(String prevHash, String action, String entityName, String entityId, String payload, long timestampMs) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String raw = String.join("|", prevHash, action, entityName, entityId, payload, String.valueOf(timestampMs));
            byte[] hashBytes = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}

