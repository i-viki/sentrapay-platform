package dev.jayavignesh.sentrapay.wallet.service;

import dev.jayavignesh.sentrapay.wallet.dto.AddBeneficiaryRequest;
import dev.jayavignesh.sentrapay.wallet.dto.BeneficiaryResponse;
import dev.jayavignesh.sentrapay.wallet.entity.Beneficiary;
import dev.jayavignesh.sentrapay.wallet.entity.User;
import dev.jayavignesh.sentrapay.wallet.entity.Wallet;
import dev.jayavignesh.sentrapay.wallet.repository.BeneficiaryRepository;
import dev.jayavignesh.sentrapay.wallet.repository.UserRepository;
import dev.jayavignesh.sentrapay.wallet.repository.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class BeneficiaryService {

    public static final BigDecimal COOLING_OFF_MAX_AMOUNT = new BigDecimal("5000.00");
    public static final int COOLING_OFF_HOURS = 24;

    private final BeneficiaryRepository beneficiaryRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;

    public BeneficiaryService(
            BeneficiaryRepository beneficiaryRepository,
            UserRepository userRepository,
            WalletRepository walletRepository
    ) {
        this.beneficiaryRepository = beneficiaryRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
    }

    @Transactional
    public BeneficiaryResponse addBeneficiary(Long userId, AddBeneficiaryRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        Wallet recipientWallet = walletRepository.findByWalletNumber(request.getRecipientWalletNumber())
                .orElseThrow(() -> new IllegalArgumentException("Recipient wallet does not exist: " + request.getRecipientWalletNumber()));

        Wallet userWallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Current user wallet not found"));

        if (userWallet.getId().equals(recipientWallet.getId())) {
            throw new IllegalArgumentException("Cannot add your own wallet as a beneficiary");
        }

        Optional<Beneficiary> existing = beneficiaryRepository.findByUserIdAndRecipientWalletNumber(userId, request.getRecipientWalletNumber());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Beneficiary is already registered for this wallet number");
        }

        Instant coolingOffUntil = Instant.now().plus(Duration.ofHours(COOLING_OFF_HOURS));
        BigDecimal dailyLimit = request.getDailyLimit() != null && request.getDailyLimit().compareTo(BigDecimal.ZERO) > 0
                ? request.getDailyLimit()
                : new BigDecimal("50000.00");

        Beneficiary beneficiary = new Beneficiary(
                user,
                request.getBeneficiaryName(),
                request.getRecipientWalletNumber(),
                coolingOffUntil,
                dailyLimit
        );

        Beneficiary saved = beneficiaryRepository.save(beneficiary);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BeneficiaryResponse> getBeneficiaries(Long userId) {
        return beneficiaryRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public void validateTransferAgainstBeneficiaryGuardrails(Long userId, String recipientWalletNumber, BigDecimal amount) {
        Optional<Beneficiary> opt = beneficiaryRepository.findByUserIdAndRecipientWalletNumber(userId, recipientWalletNumber);
        if (opt.isPresent()) {
            Beneficiary b = opt.get();
            if (b.isCoolingOffActive() && amount.compareTo(COOLING_OFF_MAX_AMOUNT) > 0) {
                long hoursLeft = Math.max(1, Duration.between(Instant.now(), b.getCoolingOffUntil()).toHours());
                throw new IllegalArgumentException(String.format(
                        "Beneficiary '%s' is in 24-hour security cooling-off (%d hours remaining). Transfers capped at INR %s.",
                        b.getBeneficiaryName(), hoursLeft, COOLING_OFF_MAX_AMOUNT
                ));
            }

            if (b.getDailyLimit() != null && amount.compareTo(b.getDailyLimit()) > 0) {
                throw new IllegalArgumentException(String.format(
                        "Transfer amount exceeds configured daily limit of INR %s for beneficiary '%s'.",
                        b.getDailyLimit(), b.getBeneficiaryName()
                ));
            }
        }
    }

    @Transactional(readOnly = true)
    public boolean isKnownBeneficiary(Long userId, String recipientWalletNumber) {
        return beneficiaryRepository.findByUserIdAndRecipientWalletNumber(userId, recipientWalletNumber)
                .filter(b -> !b.isCoolingOffActive())
                .isPresent();
    }

    private BeneficiaryResponse mapToResponse(Beneficiary b) {
        BeneficiaryResponse res = new BeneficiaryResponse();
        res.setId(b.getId());
        res.setBeneficiaryName(b.getBeneficiaryName());
        res.setRecipientWalletNumber(b.getRecipientWalletNumber());
        res.setDailyLimit(b.getDailyLimit());
        res.setCreatedAt(b.getCreatedAt());

        boolean active = b.isCoolingOffActive();
        res.setCoolingOffActive(active);
        if (active) {
            long remaining = Duration.between(Instant.now(), b.getCoolingOffUntil()).toHours();
            res.setCoolingOffRemainingHours(Math.max(1, remaining));
        } else {
            res.setCoolingOffRemainingHours(0);
        }

        return res;
    }
}

