package dev.jayavignesh.sentrapay.recon.repository;

import dev.jayavignesh.sentrapay.recon.entity.StatementRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StatementRecordRepository extends JpaRepository<StatementRecord, Long> {
    List<StatementRecord> findByBankStatementId(Long bankStatementId);
    Optional<StatementRecord> findByUtrNumber(String utrNumber);
    long countByBankStatementIdAndReconciledTrue(Long bankStatementId);
    long countByBankStatementIdAndReconciledFalse(Long bankStatementId);
}

