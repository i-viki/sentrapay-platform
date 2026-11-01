package dev.jayavignesh.sentrapay.wallet.service;

import dev.jayavignesh.sentrapay.wallet.dto.CreatePaymentRequestDto;
import dev.jayavignesh.sentrapay.wallet.dto.PaymentRequestResponse;
import dev.jayavignesh.sentrapay.wallet.dto.TransactionResponse;
import dev.jayavignesh.sentrapay.wallet.dto.TransferRequest;
import dev.jayavignesh.sentrapay.wallet.entity.PaymentRequest;
import dev.jayavignesh.sentrapay.wallet.entity.Wallet;
import dev.jayavignesh.sentrapay.wallet.repository.PaymentRequestRepository;
import dev.jayavignesh.sentrapay.wallet.repository.WalletRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class PaymentRequestService {

    private final PaymentRequestRepository paymentRequestRepository;
    private final WalletRepository walletRepository;
    private final PaymentSwitchService paymentSwitchService;

    public PaymentRequestService(
            PaymentRequestRepository paymentRequestRepository,
            WalletRepository walletRepository,
            @Lazy PaymentSwitchService paymentSwitchService
    ) {
        this.paymentRequestRepository = paymentRequestRepository;
        this.walletRepository = walletRepository;
        this.paymentSwitchService = paymentSwitchService;
    }

    @Transactional
    public PaymentRequestResponse createPaymentRequest(Long requesterUserId, CreatePaymentRequestDto dto) {
        Wallet requesterWallet = walletRepository.findByUserId(requesterUserId)
                .orElseThrow(() -> new IllegalArgumentException("Requester wallet not found for user: " + requesterUserId));

        Wallet payerWallet = walletRepository.findByWalletNumber(dto.getPayerWalletNumber())
                .orElseThrow(() -> new IllegalArgumentException("Target payer wallet not found: " + dto.getPayerWalletNumber()));

        if (requesterWallet.getId().equals(payerWallet.getId())) {
            throw new IllegalArgumentException("Cannot create a payment request to your own wallet");
        }

        int expiryMin = dto.getExpiryMinutes() != null && dto.getExpiryMinutes() > 0 ? dto.getExpiryMinutes() : 1440;
        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(expiryMin));

        String ref = "REQ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        PaymentRequest pr = new PaymentRequest();
        pr.setRequestReference(ref);
        pr.setRequesterWallet(requesterWallet);
        pr.setPayerWallet(payerWallet);
        pr.setAmount(dto.getAmount());
        pr.setCurrency(dto.getCurrency() != null ? dto.getCurrency() : "INR");
        pr.setDescription(dto.getDescription());
        pr.setStatus("PENDING");
        pr.setExpiresAt(expiresAt);
        pr.setCreatedAt(Instant.now());
        pr.setUpdatedAt(Instant.now());

        PaymentRequest saved = paymentRequestRepository.save(pr);
        return mapToResponse(saved);
    }

    @Transactional
    public List<PaymentRequestResponse> getIncomingRequests(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("User wallet not found: " + userId));

        List<PaymentRequest> requests = paymentRequestRepository.findByPayerWalletIdOrderByCreatedAtDesc(wallet.getId());
        // Auto-expire
        for (PaymentRequest r : requests) {
            if ("PENDING".equals(r.getStatus()) && r.isExpired()) {
                r.setStatus("EXPIRED");
                r.setUpdatedAt(Instant.now());
                paymentRequestRepository.save(r);
            }
        }
        return requests.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public List<PaymentRequestResponse> getOutgoingRequests(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("User wallet not found: " + userId));

        List<PaymentRequest> requests = paymentRequestRepository.findByRequesterWalletIdOrderByCreatedAtDesc(wallet.getId());
        for (PaymentRequest r : requests) {
            if ("PENDING".equals(r.getStatus()) && r.isExpired()) {
                r.setStatus("EXPIRED");
                r.setUpdatedAt(Instant.now());
                paymentRequestRepository.save(r);
            }
        }
        return requests.stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public TransactionResponse approveAndPay(Long payerUserId, String requestReference, String idempotencyKey) {
        PaymentRequest pr = paymentRequestRepository.findByRequestReference(requestReference)
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found: " + requestReference));

        Wallet payerWallet = walletRepository.findByUserId(payerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Payer wallet not found for user: " + payerUserId));

        if (!pr.getPayerWallet().getId().equals(payerWallet.getId())) {
            throw new IllegalArgumentException("You are not authorized to approve this payment request");
        }

        if (!"PENDING".equals(pr.getStatus())) {
            throw new IllegalStateException("Payment request is already " + pr.getStatus());
        }

        if (pr.isExpired()) {
            pr.setStatus("EXPIRED");
            pr.setUpdatedAt(Instant.now());
            paymentRequestRepository.save(pr);
            throw new IllegalStateException("Payment request has expired");
        }

        // Bridge into the distributed Kafka Saga switch
        TransferRequest transferRequest = new TransferRequest();
        transferRequest.setRecipientWalletNumber(pr.getRequesterWallet().getWalletNumber());
        transferRequest.setAmount(pr.getAmount());
        transferRequest.setCurrency(pr.getCurrency());
        transferRequest.setPaymentMethod("UPI_COLLECT_REQUEST");
        transferRequest.setClaimedUtr("COLLECT-" + pr.getRequestReference());

        String effectiveIdemKey = idempotencyKey != null && !idempotencyKey.isBlank()
                ? idempotencyKey
                : "REQ-PAY-" + pr.getRequestReference();

        TransactionResponse txResponse = paymentSwitchService.initiateTransfer(payerUserId, effectiveIdemKey, transferRequest);

        pr.setStatus("FULFILLED");
        pr.setFulfilledPaymentReference(txResponse.getPaymentReference());
        pr.setUpdatedAt(Instant.now());
        paymentRequestRepository.save(pr);

        return txResponse;
    }

    @Transactional
    public PaymentRequestResponse rejectRequest(Long payerUserId, String requestReference) {
        PaymentRequest pr = paymentRequestRepository.findByRequestReference(requestReference)
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found: " + requestReference));

        Wallet payerWallet = walletRepository.findByUserId(payerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Payer wallet not found for user: " + payerUserId));

        if (!pr.getPayerWallet().getId().equals(payerWallet.getId())) {
            throw new IllegalArgumentException("You are not authorized to reject this payment request");
        }

        if (!"PENDING".equals(pr.getStatus())) {
            throw new IllegalStateException("Payment request is already " + pr.getStatus());
        }

        pr.setStatus("REJECTED");
        pr.setUpdatedAt(Instant.now());
        PaymentRequest updated = paymentRequestRepository.save(pr);
        return mapToResponse(updated);
    }

    private PaymentRequestResponse mapToResponse(PaymentRequest pr) {
        PaymentRequestResponse res = new PaymentRequestResponse();
        res.setId(pr.getId());
        res.setRequestReference(pr.getRequestReference());
        res.setRequesterWalletNumber(pr.getRequesterWallet().getWalletNumber());
        res.setRequesterName(pr.getRequesterWallet().getUser() != null ? pr.getRequesterWallet().getUser().getFullName() : "Unknown");
        res.setPayerWalletNumber(pr.getPayerWallet().getWalletNumber());
        res.setPayerName(pr.getPayerWallet().getUser() != null ? pr.getPayerWallet().getUser().getFullName() : "Unknown");
        res.setAmount(pr.getAmount());
        res.setCurrency(pr.getCurrency());
        res.setDescription(pr.getDescription());
        res.setStatus(pr.getStatus());
        res.setExpiresAt(pr.getExpiresAt());
        res.setExpired(pr.isExpired());
        res.setFulfilledPaymentReference(pr.getFulfilledPaymentReference());
        res.setCreatedAt(pr.getCreatedAt());
        return res;
    }
}

