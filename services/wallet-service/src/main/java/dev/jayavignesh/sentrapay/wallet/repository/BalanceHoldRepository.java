package dev.jayavignesh.sentrapay.wallet.repository;

import dev.jayavignesh.sentrapay.wallet.entity.BalanceHold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BalanceHoldRepository extends JpaRepository<BalanceHold, Long> {

    Optional<BalanceHold> findByPaymentReference(String paymentReference);

    List<BalanceHold> findByWalletIdAndStatus(Long walletId, String status);

    @Query("SELECT COALESCE(SUM(b.holdAmount), 0.00) FROM BalanceHold b WHERE b.wallet.id = :walletId AND b.status = 'ACTIVE'")
    BigDecimal sumActiveHoldsByWalletId(@Param("walletId") Long walletId);
}

