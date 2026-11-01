package dev.jayavignesh.sentrapay.recon.repository;

import dev.jayavignesh.sentrapay.recon.entity.BankStatement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BankStatementRepository extends JpaRepository<BankStatement, Long> {
    Optional<BankStatement> findByFileHashSha256(String fileHashSha256);
}

