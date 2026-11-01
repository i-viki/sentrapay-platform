package dev.jayavignesh.sentrapay.recon.repository;

import dev.jayavignesh.sentrapay.recon.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a ORDER BY a.id DESC LIMIT 1")
    Optional<AuditLog> findLatestRecord();

    List<AuditLog> findAllByOrderByIdAsc();

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}

