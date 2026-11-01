package dev.jayavignesh.sentrapay.wallet.controller;

import dev.jayavignesh.sentrapay.wallet.dto.AddBeneficiaryRequest;
import dev.jayavignesh.sentrapay.wallet.dto.ApiResponse;
import dev.jayavignesh.sentrapay.wallet.dto.BeneficiaryResponse;
import dev.jayavignesh.sentrapay.wallet.entity.User;
import dev.jayavignesh.sentrapay.wallet.repository.UserRepository;
import dev.jayavignesh.sentrapay.wallet.service.BeneficiaryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallets/beneficiaries")
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;
    private final UserRepository userRepository;

    public BeneficiaryController(BeneficiaryService beneficiaryService, UserRepository userRepository) {
        this.beneficiaryService = beneficiaryService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BeneficiaryResponse>>> getBeneficiaries(
            Authentication authentication
    ) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not authenticated"));
        List<BeneficiaryResponse> list = beneficiaryService.getBeneficiaries(user.getId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BeneficiaryResponse>> addBeneficiary(
            Authentication authentication,
            @Valid @RequestBody AddBeneficiaryRequest request
    ) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not authenticated"));
        BeneficiaryResponse res = beneficiaryService.addBeneficiary(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Beneficiary registered with 24-hour cooling off security period", res));
    }
}

