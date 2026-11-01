package dev.jayavignesh.sentrapay.recon.repository;

import dev.jayavignesh.sentrapay.recon.entity.LedgerAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LedgerAccountRepository extends JpaRepository<LedgerAccount, Long> {
    Optional<LedgerAccount> findByCode(String code);
}

