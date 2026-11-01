package dev.jayavignesh.sentrapay.recon.repository;

import dev.jayavignesh.sentrapay.recon.entity.JournalLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JournalLineRepository extends JpaRepository<JournalLine, Long> {
    List<JournalLine> findByJournalEntryId(Long journalEntryId);
}

