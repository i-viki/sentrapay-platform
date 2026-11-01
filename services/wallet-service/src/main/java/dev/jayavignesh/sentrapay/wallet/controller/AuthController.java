package dev.jayavignesh.sentrapay.wallet.controller;

import dev.jayavignesh.sentrapay.wallet.dto.ApiResponse;
import dev.jayavignesh.sentrapay.wallet.dto.AuthResponse;
import dev.jayavignesh.sentrapay.wallet.dto.LoginRequest;
import dev.jayavignesh.sentrapay.wallet.dto.RegisterRequest;
import dev.jayavignesh.sentrapay.wallet.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", response));
    }
}

