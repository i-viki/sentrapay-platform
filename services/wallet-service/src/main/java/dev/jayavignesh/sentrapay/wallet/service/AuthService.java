package dev.jayavignesh.sentrapay.wallet.service;

import dev.jayavignesh.sentrapay.wallet.dto.AuthResponse;
import dev.jayavignesh.sentrapay.wallet.dto.LoginRequest;
import dev.jayavignesh.sentrapay.wallet.dto.RegisterRequest;
import dev.jayavignesh.sentrapay.wallet.entity.User;
import dev.jayavignesh.sentrapay.wallet.entity.Wallet;
import dev.jayavignesh.sentrapay.wallet.repository.UserRepository;
import dev.jayavignesh.sentrapay.wallet.repository.WalletRepository;
import dev.jayavignesh.sentrapay.wallet.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            WalletRepository walletRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already registered: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered: " + request.getEmail());
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole("USER");
        user.setActive(true);

        User savedUser = userRepository.save(user);

        // Provision user wallet with unique number
        Wallet wallet = new Wallet();
        wallet.setUser(savedUser);
        wallet.setWalletNumber("W-" + savedUser.getUsername().toUpperCase() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        wallet.setCurrency("INR");
        wallet.setStatus("ACTIVE");
        wallet.setInitialBalance(new BigDecimal("1000.00")); // Initial signup bonus / starter balance
        Wallet savedWallet = walletRepository.save(wallet);

        org.springframework.security.core.userdetails.User userDetails = new org.springframework.security.core.userdetails.User(
                savedUser.getUsername(),
                savedUser.getPasswordHash(),
                java.util.Collections.emptyList()
        );

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", savedUser.getId());
        extraClaims.put("role", savedUser.getRole());
        extraClaims.put("walletNumber", savedWallet.getWalletNumber());

        String token = jwtService.generateToken(userDetails, extraClaims);

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedWallet.getWalletNumber()
        );
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        Wallet wallet = walletRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("Wallet not found for user: " + user.getUsername()));

        org.springframework.security.core.userdetails.User userDetails = new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                java.util.Collections.emptyList()
        );

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId());
        extraClaims.put("role", user.getRole());
        extraClaims.put("walletNumber", wallet.getWalletNumber());

        String token = jwtService.generateToken(userDetails, extraClaims);

        return new AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                wallet.getWalletNumber()
        );
    }
}

