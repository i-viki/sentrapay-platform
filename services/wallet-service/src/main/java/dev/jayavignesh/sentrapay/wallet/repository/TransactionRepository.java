package dev.jayavignesh.sentrapay.wallet.repository;

import dev.jayavignesh.sentrapay.wallet.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByPaymentReference(String paymentReference);

    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT t FROM Transaction t WHERE t.senderWallet.id = :walletId OR t.recipientWallet.id = :walletId ORDER BY t.createdAt DESC")
    Page<Transaction> findByWalletId(@Param("walletId") Long walletId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.amount), 0.00) FROM Transaction t WHERE t.senderWallet.id = :walletId AND t.status = 'SETTLED'")
    BigDecimal sumSettledDebits(@Param("walletId") Long walletId);

    @Query("SELECT COALESCE(SUM(t.amount), 0.00) FROM Transaction t WHERE t.recipientWallet.id = :walletId AND t.status = 'SETTLED'")
    BigDecimal sumSettledCredits(@Param("walletId") Long walletId);
}

