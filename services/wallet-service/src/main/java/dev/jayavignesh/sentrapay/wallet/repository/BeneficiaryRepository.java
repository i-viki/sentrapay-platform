package dev.jayavignesh.sentrapay.wallet.repository;

import dev.jayavignesh.sentrapay.wallet.entity.Beneficiary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BeneficiaryRepository extends JpaRepository<Beneficiary, Long> {
    List<Beneficiary> findByUserId(Long userId);
    Optional<Beneficiary> findByUserIdAndRecipientWalletNumber(Long userId, String recipientWalletNumber);
}

