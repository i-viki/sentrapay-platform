package dev.jayavignesh.sentrapay.wallet.service;

import dev.jayavignesh.sentrapay.events.PaymentInitiatedEvent;
import dev.jayavignesh.sentrapay.wallet.dto.TransactionResponse;
import dev.jayavignesh.sentrapay.wallet.dto.TransferRequest;
import dev.jayavignesh.sentrapay.wallet.entity.BalanceHold;
import dev.jayavignesh.sentrapay.wallet.entity.Transaction;
import dev.jayavignesh.sentrapay.wallet.entity.Wallet;
import dev.jayavignesh.sentrapay.wallet.kafka.PaymentKafkaProducer;
import dev.jayavignesh.sentrapay.wallet.repository.BalanceHoldRepository;
import dev.jayavignesh.sentrapay.wallet.repository.TransactionRepository;
import dev.jayavignesh.sentrapay.wallet.repository.WalletRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class PaymentSwitchService {

    private static final Logger log = LoggerFactory.getLogger(PaymentSwitchService.class);

    private final WalletRepository walletRepository;
    private final BalanceHoldRepository balanceHoldRepository;
    private final TransactionRepository transactionRepository;
    private final WalletService walletService;
    private final IdempotencyService idempotencyService;
    private final PaymentKafkaProducer kafkaProducer;
    private final BeneficiaryService beneficiaryService;

    public PaymentSwitchService(
            WalletRepository walletRepository,
            BalanceHoldRepository balanceHoldRepository,
            TransactionRepository transactionRepository,
            WalletService walletService,
            IdempotencyService idempotencyService,
            PaymentKafkaProducer kafkaProducer,
            BeneficiaryService beneficiaryService
    ) {
        this.walletRepository = walletRepository;
        this.balanceHoldRepository = balanceHoldRepository;
        this.transactionRepository = transactionRepository;
        this.walletService = walletService;
        this.idempotencyService = idempotencyService;
        this.kafkaProducer = kafkaProducer;
        this.beneficiaryService = beneficiaryService;
    }

    @Transactional
    public TransactionResponse initiateTransfer(Long senderUserId, String idempotencyKey, TransferRequest request) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new IllegalArgumentException("Idempotency-Key header is mandatory for payment switch transfers");
        }

        // 1. Idempotency Check
        var existingTxOpt = transactionRepository.findByIdempotencyKey(idempotencyKey);
        if (existingTxOpt.isPresent()) {
            log.info("Idempotent replay detected for key: {}", idempotencyKey);
            return mapToResponse(existingTxOpt.get());
        }

        String paymentReference = "TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        boolean locked = idempotencyService.acquire(idempotencyKey, paymentReference);
        if (!locked) {
            String lockedRef = idempotencyService.getExistingReference(idempotencyKey);
            if (lockedRef != null) {
                var existing = transactionRepository.findByPaymentReference(lockedRef);
                if (existing.isPresent()) {
                    return mapToResponse(existing.get());
                }
            }
            throw new IllegalStateException("A transfer with this Idempotency-Key is currently in-flight. Please retry shortly.");
        }

        // 2. Validate Sender Wallet
        Wallet senderWallet = walletRepository.findByUserId(senderUserId)
                .orElseThrow(() -> new IllegalArgumentException("Sender wallet not found for user id: " + senderUserId));

        // 3. Validate Recipient Wallet
        Wallet recipientWallet = walletRepository.findByWalletNumber(request.getRecipientWalletNumber())
                .orElseThrow(() -> new IllegalArgumentException("Recipient wallet not found: " + request.getRecipientWalletNumber()));

        if (senderWallet.getId().equals(recipientWallet.getId())) {
            throw new IllegalArgumentException("Sender and recipient wallets cannot be identical");
        }

        // 3b. Validate Beneficiary Cooling-Off & Limit Guardrails
        beneficiaryService.validateTransferAgainstBeneficiaryGuardrails(senderUserId, request.getRecipientWalletNumber(), request.getAmount());

        // 4. Balance Verification
        BigDecimal availableBalance = walletService.calculateAvailableBalance(senderWallet.getId());
        if (availableBalance.compareTo(request.getAmount()) < 0) {
            throw new IllegalArgumentException(String.format("Insufficient funds. Available: %s, Requested: %s",
                    availableBalance, request.getAmount()));
        }

        // 5. Establish Balance Hold
        BalanceHold hold = new BalanceHold(
                senderWallet,
                paymentReference,
                request.getAmount(),
                Instant.now().plus(Duration.ofMinutes(15))
        );
        balanceHoldRepository.save(hold);

        // 6. Record Initiated Transaction
        Transaction tx = new Transaction();
        tx.setPaymentReference(paymentReference);
        tx.setIdempotencyKey(idempotencyKey);
        tx.setSenderWallet(senderWallet);
        tx.setRecipientWallet(recipientWallet);
        tx.setAmount(request.getAmount());
        tx.setCurrency(request.getCurrency() != null ? request.getCurrency() : "INR");
        tx.setPaymentChannel(request.getPaymentMethod() != null ? request.getPaymentMethod() : "WALLET_TRANSFER");
        tx.setStatus("INITIATED");
        tx.setClaimedUtr(request.getClaimedUtr());
        tx.setCreatedAt(Instant.now());
        tx.setUpdatedAt(Instant.now());

        Transaction savedTx = transactionRepository.save(tx);

        // 7. Publish to Kafka payments.initiated
        PaymentInitiatedEvent event = new PaymentInitiatedEvent(
                paymentReference,
                idempotencyKey,
                senderWallet.getId(),
                recipientWallet.getId(),
                request.getAmount(),
                tx.getCurrency(),
                tx.getPaymentChannel(),
                request.getIpAddress() != null ? request.getIpAddress() : "127.0.0.1",
                Instant.now()
        );
        kafkaProducer.sendPaymentInitiated(event);

        return mapToResponse(savedTx);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getByPaymentReference(String paymentReference) {
        Transaction tx = transactionRepository.findByPaymentReference(paymentReference)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found for reference: " + paymentReference));
        return mapToResponse(tx);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getHistoryForUser(Long userId, Pageable pageable) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found for user: " + userId));

        return transactionRepository.findByWalletId(wallet.getId(), pageable)
                .map(this::mapToResponse);
    }

    private TransactionResponse mapToResponse(Transaction tx) {
        TransactionResponse res = new TransactionResponse();
        res.setId(tx.getId());
        res.setPaymentReference(tx.getPaymentReference());
        res.setIdempotencyKey(tx.getIdempotencyKey());
        res.setSenderWalletNumber(tx.getSenderWallet().getWalletNumber());
        res.setRecipientWalletNumber(tx.getRecipientWallet().getWalletNumber());
        res.setAmount(tx.getAmount());
        res.setCurrency(tx.getCurrency());
        res.setPaymentChannel(tx.getPaymentChannel());
        res.setStatus(tx.getStatus());
        res.setRiskScore(tx.getRiskScore());
        res.setRiskTier(tx.getRiskTier());
        res.setClaimedUtr(tx.getClaimedUtr());
        res.setFailureReason(tx.getFailureReason());
        res.setCreatedAt(tx.getCreatedAt());
        return res;
    }
}

