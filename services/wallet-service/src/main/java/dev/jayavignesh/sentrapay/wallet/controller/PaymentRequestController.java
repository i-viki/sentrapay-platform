package dev.jayavignesh.sentrapay.wallet.controller;

import dev.jayavignesh.sentrapay.wallet.dto.ApiResponse;
import dev.jayavignesh.sentrapay.wallet.dto.CreatePaymentRequestDto;
import dev.jayavignesh.sentrapay.wallet.dto.PaymentRequestResponse;
import dev.jayavignesh.sentrapay.wallet.dto.TransactionResponse;
import dev.jayavignesh.sentrapay.wallet.entity.User;
import dev.jayavignesh.sentrapay.wallet.repository.UserRepository;
import dev.jayavignesh.sentrapay.wallet.service.PaymentRequestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallets/requests")
public class PaymentRequestController {

    private final PaymentRequestService paymentRequestService;
    private final UserRepository userRepository;

    public PaymentRequestController(PaymentRequestService paymentRequestService, UserRepository userRepository) {
        this.paymentRequestService = paymentRequestService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentRequestResponse>> createPaymentRequest(
            Authentication authentication,
            @Valid @RequestBody CreatePaymentRequestDto dto
    ) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not authenticated"));
        PaymentRequestResponse res = paymentRequestService.createPaymentRequest(user.getId(), dto);
        return ResponseEntity.ok(ApiResponse.success("P2P Payment request generated successfully", res));
    }

    @GetMapping("/incoming")
    public ResponseEntity<ApiResponse<List<PaymentRequestResponse>>> getIncomingRequests(
            Authentication authentication
    ) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not authenticated"));
        List<PaymentRequestResponse> list = paymentRequestService.getIncomingRequests(user.getId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/outgoing")
    public ResponseEntity<ApiResponse<List<PaymentRequestResponse>>> getOutgoingRequests(
            Authentication authentication
    ) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not authenticated"));
        List<PaymentRequestResponse> list = paymentRequestService.getOutgoingRequests(user.getId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/{reference}/approve")
    public ResponseEntity<ApiResponse<TransactionResponse>> approveAndPay(
            Authentication authentication,
            @PathVariable String reference,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not authenticated"));
        TransactionResponse tx = paymentRequestService.approveAndPay(user.getId(), reference, idempotencyKey);
        return ResponseEntity.ok(ApiResponse.success("Payment request approved and dispatched to Saga switch", tx));
    }

    @PostMapping("/{reference}/reject")
    public ResponseEntity<ApiResponse<PaymentRequestResponse>> rejectRequest(
            Authentication authentication,
            @PathVariable String reference
    ) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not authenticated"));
        PaymentRequestResponse res = paymentRequestService.rejectRequest(user.getId(), reference);
        return ResponseEntity.ok(ApiResponse.success("Payment request rejected", res));
    }
}

