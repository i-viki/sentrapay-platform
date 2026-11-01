package dev.jayavignesh.sentrapay.wallet.controller;

import dev.jayavignesh.sentrapay.wallet.dto.ApiResponse;
import dev.jayavignesh.sentrapay.wallet.dto.TransactionResponse;
import dev.jayavignesh.sentrapay.wallet.dto.TransferRequest;
import dev.jayavignesh.sentrapay.wallet.entity.User;
import dev.jayavignesh.sentrapay.wallet.repository.UserRepository;
import dev.jayavignesh.sentrapay.wallet.service.PaymentSwitchService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentSwitchService paymentSwitchService;
    private final UserRepository userRepository;

    public PaymentController(PaymentSwitchService paymentSwitchService, UserRepository userRepository) {
        this.paymentSwitchService = paymentSwitchService;
        this.userRepository = userRepository;
    }

    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<TransactionResponse>> transfer(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody TransferRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest
    ) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not authenticated"));

        if (request.getIpAddress() == null || request.getIpAddress().isBlank()) {
            request.setIpAddress(servletRequest.getRemoteAddr());
        }

        TransactionResponse response = paymentSwitchService.initiateTransfer(user.getId(), idempotencyKey, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Transfer submitted to payment switch", response));
    }

    @GetMapping("/{reference}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getByReference(@PathVariable String reference) {
        TransactionResponse response = paymentSwitchService.getByPaymentReference(reference);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not authenticated"));

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<TransactionResponse> history = paymentSwitchService.getHistoryForUser(user.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}

