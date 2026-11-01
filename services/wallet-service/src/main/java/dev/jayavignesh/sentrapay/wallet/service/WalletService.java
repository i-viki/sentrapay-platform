package dev.jayavignesh.sentrapay.wallet.service;

import dev.jayavignesh.sentrapay.wallet.dto.DepositRequest;
import dev.jayavignesh.sentrapay.wallet.dto.WalletResponse;
import dev.jayavignesh.sentrapay.wallet.entity.Wallet;
import dev.jayavignesh.sentrapay.wallet.repository.BalanceHoldRepository;
import dev.jayavignesh.sentrapay.wallet.repository.TransactionRepository;
import dev.jayavignesh.sentrapay.wallet.repository.UserRepository;
import dev.jayavignesh.sentrapay.wallet.repository.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final BalanceHoldRepository balanceHoldRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public WalletService(
            WalletRepository walletRepository,
            BalanceHoldRepository balanceHoldRepository,
            TransactionRepository transactionRepository,
            UserRepository userRepository
    ) {
        this.walletRepository = walletRepository;
        this.balanceHoldRepository = balanceHoldRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<WalletResponse> getAllWallets() {
        return walletRepository.findAll().stream()
                .map(this::buildWalletResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public WalletResponse getWalletByUserId(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found for user id: " + userId));

        return buildWalletResponse(wallet);
    }

    @Transactional(readOnly = true)
    public WalletResponse getWalletByNumber(String walletNumber) {
        Wallet wallet = walletRepository.findByWalletNumber(walletNumber)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found for number: " + walletNumber));

        return buildWalletResponse(wallet);
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateAvailableBalance(Long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found with id: " + walletId));

        BigDecimal initial = wallet.getInitialBalance() != null ? wallet.getInitialBalance() : BigDecimal.ZERO;
        BigDecimal credits = transactionRepository.sumSettledCredits(walletId);
        BigDecimal debits = transactionRepository.sumSettledDebits(walletId);
        BigDecimal holds = balanceHoldRepository.sumActiveHoldsByWalletId(walletId);

        BigDecimal currentBalance = initial.add(credits).subtract(debits);
        return currentBalance.subtract(holds);
    }

    @Transactional
    public WalletResponse deposit(Long userId, DepositRequest request) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found for user: " + userId));

        wallet.setInitialBalance(wallet.getInitialBalance().add(request.getAmount()));
        Wallet saved = walletRepository.save(wallet);

        return buildWalletResponse(saved);
    }

    private WalletResponse buildWalletResponse(Wallet wallet) {
        Long walletId = wallet.getId();
        BigDecimal initial = wallet.getInitialBalance() != null ? wallet.getInitialBalance() : BigDecimal.ZERO;
        BigDecimal credits = transactionRepository.sumSettledCredits(walletId);
        BigDecimal debits = transactionRepository.sumSettledDebits(walletId);
        BigDecimal holds = balanceHoldRepository.sumActiveHoldsByWalletId(walletId);

        BigDecimal currentBalance = initial.add(credits).subtract(debits);
        BigDecimal availableBalance = currentBalance.subtract(holds);

        WalletResponse response = new WalletResponse();
        response.setId(wallet.getId());
        response.setWalletNumber(wallet.getWalletNumber());
        response.setUsername(wallet.getUser().getUsername());
        response.setFullName(wallet.getUser().getFullName());
        response.setCurrency(wallet.getCurrency());
        response.setStatus(wallet.getStatus());
        response.setCurrentBalance(currentBalance);
        response.setAvailableBalance(availableBalance);
        response.setActiveHolds(holds);
        response.setCreatedAt(wallet.getCreatedAt());
        return response;
    }
}

