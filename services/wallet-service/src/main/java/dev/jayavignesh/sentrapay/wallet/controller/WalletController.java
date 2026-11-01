package dev.jayavignesh.sentrapay.wallet.controller;

import dev.jayavignesh.sentrapay.wallet.dto.ApiResponse;
import dev.jayavignesh.sentrapay.wallet.dto.DepositRequest;
import dev.jayavignesh.sentrapay.wallet.dto.WalletResponse;
import dev.jayavignesh.sentrapay.wallet.entity.User;
import dev.jayavignesh.sentrapay.wallet.repository.UserRepository;
import dev.jayavignesh.sentrapay.wallet.service.WalletService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallets")
public class WalletController {

    private final WalletService walletService;
    private final UserRepository userRepository;

    public WalletController(WalletService walletService, UserRepository userRepository) {
        this.walletService = walletService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WalletResponse>>> getAllWallets() {
        List<WalletResponse> wallets = walletService.getAllWallets();
        return ResponseEntity.ok(ApiResponse.success(wallets));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<WalletResponse>> getCurrentUserWallet(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + authentication.getName()));

        WalletResponse wallet = walletService.getWalletByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(wallet));
    }

    @GetMapping("/{walletNumber}")
    public ResponseEntity<ApiResponse<WalletResponse>> getWalletByNumber(@PathVariable String walletNumber) {
        WalletResponse wallet = walletService.getWalletByNumber(walletNumber);
        return ResponseEntity.ok(ApiResponse.success(wallet));
    }

    @PostMapping("/deposit")
    public ResponseEntity<ApiResponse<WalletResponse>> deposit(
            Authentication authentication,
            @Valid @RequestBody DepositRequest request
    ) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + authentication.getName()));

        WalletResponse response = walletService.deposit(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Deposit completed successfully", response));
    }
}

