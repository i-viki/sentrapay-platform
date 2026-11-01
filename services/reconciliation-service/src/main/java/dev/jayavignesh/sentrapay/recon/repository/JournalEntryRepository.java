package dev.jayavignesh.sentrapay.recon.repository;

import dev.jayavignesh.sentrapay.recon.entity.JournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    Optional<JournalEntry> findByEntryNumber(String entryNumber);

    Optional<JournalEntry> findByTransactionId(Long transactionId);

    Page<JournalEntry> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT COALESCE(SUM(j.totalDebit), 0.00) FROM JournalEntry j")
    BigDecimal sumTotalDebits();

    @Query("SELECT COALESCE(SUM(j.totalCredit), 0.00) FROM JournalEntry j")
    BigDecimal sumTotalCredits();
}

