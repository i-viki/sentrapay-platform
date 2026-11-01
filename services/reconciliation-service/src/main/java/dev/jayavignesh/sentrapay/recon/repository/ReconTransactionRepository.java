package dev.jayavignesh.sentrapay.recon.repository;

import dev.jayavignesh.sentrapay.recon.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReconTransactionRepository extends JpaRepository<Transaction, Long> {
    Optional<Transaction> findByPaymentReference(String paymentReference);
    Optional<Transaction> findByClaimedUtr(String claimedUtr);
    Optional<Transaction> findByClaimedUtrAndAmount(String claimedUtr, BigDecimal amount);
    List<Transaction> findTop100ByClaimedUtrIsNotNullOrderByCreatedAtDesc();
}

