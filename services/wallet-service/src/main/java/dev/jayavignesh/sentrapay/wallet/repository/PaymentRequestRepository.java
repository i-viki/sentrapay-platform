package dev.jayavignesh.sentrapay.wallet.repository;

import dev.jayavignesh.sentrapay.wallet.entity.PaymentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, Long> {
    List<PaymentRequest> findByPayerWalletIdOrderByCreatedAtDesc(Long payerWalletId);
    List<PaymentRequest> findByRequesterWalletIdOrderByCreatedAtDesc(Long requesterWalletId);
    Optional<PaymentRequest> findByRequestReference(String requestReference);
}

