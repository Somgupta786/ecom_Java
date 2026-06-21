package com.ecommerce.lite.controller;

import com.ecommerce.lite.dto.*;
import com.ecommerce.lite.model.Address;
import com.ecommerce.lite.model.User;
import com.ecommerce.lite.repository.UserRepository;
import com.ecommerce.lite.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site:Lax}")
    private String cookieSameSite;

    @GetMapping("/check-email")
    public ResponseEntity<java.util.Map<String, Boolean>> checkEmail(@RequestParam String email) {
        boolean exists = userRepository.existsByEmail(email);
        java.util.Map<String, Boolean> response = new java.util.HashMap<>();
        response.put("exists", exists);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.register(request);
        setRefreshTokenCookie(response, authResponse.getRefreshToken());
        authResponse.setRefreshToken("");
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        setRefreshTokenCookie(response, authResponse.getRefreshToken());
        authResponse.setRefreshToken("");
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken, HttpServletResponse response) {
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            return ResponseEntity.status(401).body("{ \"error\": \"Refresh token cookie missing\" }");
        }
        try {
            TokenRefreshRequest request = new TokenRefreshRequest();
            request.setRefreshToken(refreshToken);
            TokenRefreshResponse refreshResponse = authService.refresh(request);
            
            setRefreshTokenCookie(response, refreshResponse.getRefreshToken());
            return ResponseEntity.ok(new TokenRefreshResponse(refreshResponse.getAccessToken(), ""));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("{ \"error\": \"" + e.getMessage() + "\" }");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        clearRefreshTokenCookie(response);
        return ResponseEntity.ok().body("{ \"message\": \"Logged out successfully\" }");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getProfile(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("{ \"error\": \"Unauthorized\" }");
        }
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(user);
    }

    @PostMapping("/addresses")
    public ResponseEntity<User> addAddress(Principal principal, @RequestBody Address address) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.getAddresses().add(address);
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/addresses/{index}")
    public ResponseEntity<User> editAddress(Principal principal, @PathVariable int index, @RequestBody Address address) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (index >= 0 && index < user.getAddresses().size()) {
            user.getAddresses().set(index, address);
            return ResponseEntity.ok(userRepository.save(user));
        }
        return ResponseEntity.badRequest().build();
    }

    @DeleteMapping("/addresses/{index}")
    public ResponseEntity<User> deleteAddress(Principal principal, @PathVariable int index) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (index >= 0 && index < user.getAddresses().size()) {
            user.getAddresses().remove(index);
            return ResponseEntity.ok(userRepository.save(user));
        }
        return ResponseEntity.badRequest().build();
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7 days matching JWT expiration
                .sameSite(cookieSameSite)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0) // immediately delete
                .sameSite(cookieSameSite)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
