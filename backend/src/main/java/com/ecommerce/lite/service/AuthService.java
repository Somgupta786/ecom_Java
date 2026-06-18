package com.ecommerce.lite.service;

import com.ecommerce.lite.config.JwtUtils;
import com.ecommerce.lite.dto.*;
import com.ecommerce.lite.model.User;
import com.ecommerce.lite.model.UserRole;
import com.ecommerce.lite.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        String referralCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(UserRole.ROLE_USER)
                .referralCode(referralCode)
                .rewardPoints(0)
                .isActive(true)
                .build();

        // Handle referral link logic
        if (request.getReferredBy() != null && !request.getReferredBy().trim().isEmpty()) {
            System.out.println("[REFERRAL] Register request has referredBy: '" + request.getReferredBy() + "'");
            Optional<User> referrerOpt = userRepository.findByReferralCode(request.getReferredBy().trim().toUpperCase());
            if (referrerOpt.isPresent()) {
                User referrer = referrerOpt.get();
                System.out.println("[REFERRAL] Referrer user found: " + referrer.getEmail() + ", current points: " + referrer.getRewardPoints());
                referrer.setRewardPoints(referrer.getRewardPoints() + 50);
                user.setRewardPoints(10);
                user.setReferredBy(referrer.getReferralCode());
                userRepository.save(referrer);
                System.out.println("[REFERRAL] Updated referrer points to: " + referrer.getRewardPoints() + ", user points set to: " + user.getRewardPoints());
            } else {
                System.out.println("[REFERRAL] Referrer user NOT found for code: '" + request.getReferredBy().trim().toUpperCase() + "'");
            }
        }

        User savedUser = userRepository.save(user);
        
        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String accessToken = jwtUtils.generateToken(userDetails);
        String refreshToken = jwtUtils.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .email(savedUser.getEmail())
                .role(savedUser.getRole().name())
                .rewardPoints(savedUser.getRewardPoints())
                .referralCode(savedUser.getReferralCode())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtils.generateToken(userDetails);
        String refreshToken = jwtUtils.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .role(user.getRole().name())
                .rewardPoints(user.getRewardPoints())
                .referralCode(user.getReferralCode())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .build();
    }

    public TokenRefreshResponse refresh(TokenRefreshRequest request) {
        String username = jwtUtils.extractUsername(request.getRefreshToken());
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        
        if (jwtUtils.validateToken(request.getRefreshToken(), userDetails)) {
            String newAccess = jwtUtils.generateToken(userDetails);
            String newRefresh = jwtUtils.generateRefreshToken(userDetails);
            return new TokenRefreshResponse(newAccess, newRefresh);
        } else {
            throw new IllegalArgumentException("Expired or invalid refresh token");
        }
    }
}
