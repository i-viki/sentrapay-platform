package dev.jayavignesh.sentrapay.recon.service;

import dev.jayavignesh.sentrapay.recon.entity.JournalEntry;
import dev.jayavignesh.sentrapay.recon.entity.JournalLine;
import dev.jayavignesh.sentrapay.recon.entity.LedgerAccount;
import dev.jayavignesh.sentrapay.recon.repository.JournalEntryRepository;
import dev.jayavignesh.sentrapay.recon.repository.LedgerAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
public class GeneralLedgerService {

    private static final Logger log = LoggerFactory.getLogger(GeneralLedgerService.class);

    private final JournalEntryRepository journalEntryRepository;
    private final LedgerAccountRepository ledgerAccountRepository;
    private final AuditLogService auditLogService;

    public record TrialBalanceResult(BigDecimal totalDebits, BigDecimal totalCredits, boolean balanced) {}

    public GeneralLedgerService(
            JournalEntryRepository journalEntryRepository,
            LedgerAccountRepository ledgerAccountRepository,
            AuditLogService auditLogService
    ) {
        this.journalEntryRepository = journalEntryRepository;
        this.ledgerAccountRepository = ledgerAccountRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public Optional<JournalEntry> postDoubleEntry(Long transactionId, String paymentRef, BigDecimal amount) {
        if (journalEntryRepository.findByTransactionId(transactionId).isPresent()) {
            log.info("Journal entry already exists for transaction id: {}", transactionId);
            return journalEntryRepository.findByTransactionId(transactionId);
        }

        LedgerAccount walletLiabilityAccount = ledgerAccountRepository.findByCode("2010")
                .orElseGet(() -> {
                    LedgerAccount acct = new LedgerAccount();
                    acct.setCode("2010");
                    acct.setName("User Wallet Balances (Liability)");
                    acct.setType("LIABILITY");
                    return ledgerAccountRepository.save(acct);
                });

        String entryNumber = "JE-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        JournalEntry entry = new JournalEntry();
        entry.setEntryNumber(entryNumber);
        entry.setTransactionId(transactionId);
        entry.setDescription("Settlement posting for payment reference: " + paymentRef);
        entry.setTotalDebit(amount);
        entry.setTotalCredit(amount);

        // Debit Line: Sender Wallet Liability Decreases
        JournalLine debitLine = new JournalLine(
                walletLiabilityAccount,
                "DEBIT",
                amount,
                "Debit sender wallet liability upon transfer settlement"
        );
        entry.addLine(debitLine);

        // Credit Line: Recipient Wallet Liability Increases
        JournalLine creditLine = new JournalLine(
                walletLiabilityAccount,
                "CREDIT",
                amount,
                "Credit recipient wallet liability upon transfer settlement"
        );
        entry.addLine(creditLine);

        // Mathematical invariant check
        if (entry.getTotalDebit().compareTo(entry.getTotalCredit()) != 0) {
            throw new IllegalStateException("Double-entry zero-sum invariant violated: Debits " +
                    entry.getTotalDebit() + " != Credits " + entry.getTotalCredit());
        }

        JournalEntry saved = journalEntryRepository.save(entry);
        log.info("Posted double-entry journal id={}, entryNumber={}, amount={}",
                saved.getId(), saved.getEntryNumber(), amount);

        auditLogService.append(
                "JOURNAL_POSTED",
                "JOURNAL_ENTRY",
                String.valueOf(saved.getId()),
                null,
                "127.0.0.1",
                String.format("{\"entryNumber\":\"%s\",\"transactionId\":%d,\"amount\":%s}",
                        entryNumber, transactionId, amount.toPlainString())
        );

        return Optional.of(saved);
    }

    @Transactional(readOnly = true)
    public TrialBalanceResult getTrialBalance() {
        BigDecimal debits = journalEntryRepository.sumTotalDebits();
        BigDecimal credits = journalEntryRepository.sumTotalCredits();
        boolean isBalanced = debits.compareTo(credits) == 0;
        return new TrialBalanceResult(debits, credits, isBalanced);
    }

    @Transactional(readOnly = true)
    public Page<JournalEntry> getJournalEntries(Pageable pageable) {
        return journalEntryRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
}

