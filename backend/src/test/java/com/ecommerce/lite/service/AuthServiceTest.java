package com.ecommerce.lite.service;

import com.ecommerce.lite.dto.AuthResponse;
import com.ecommerce.lite.dto.RegisterRequest;
import com.ecommerce.lite.model.User;
import com.ecommerce.lite.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testReferralPointsCrediting() {
        // 1. Create a referrer user
        RegisterRequest referrerRequest = new RegisterRequest();
        referrerRequest.setEmail("referrer@example.com");
        referrerRequest.setPassword("password123");
        referrerRequest.setFirstName("Referrer");
        referrerRequest.setLastName("User");
        
        AuthResponse referrerResponse = authService.register(referrerRequest);
        String refCode = referrerResponse.getReferralCode();
        assertNotNull(refCode);
        
        // Check initial points of referrer
        User referrerBefore = userRepository.findByEmail("referrer@example.com").orElseThrow();
        assertEquals(0, referrerBefore.getRewardPoints());

        // 2. Create a referred user using referrer's code
        RegisterRequest referredRequest = new RegisterRequest();
        referredRequest.setEmail("referred@example.com");
        referredRequest.setPassword("password123");
        referredRequest.setFirstName("Referred");
        referredRequest.setLastName("User");
        referredRequest.setReferredBy(refCode);

        AuthResponse referredResponse = authService.register(referredRequest);
        
        // 3. Verify points
        User referrerAfter = userRepository.findByEmail("referrer@example.com").orElseThrow();
        User referredAfter = userRepository.findByEmail("referred@example.com").orElseThrow();

        System.out.println("Referrer points: " + referrerAfter.getRewardPoints());
        System.out.println("Referred points: " + referredAfter.getRewardPoints());

        assertEquals(50, referrerAfter.getRewardPoints(), "Referrer should get 50 points");
        assertEquals(10, referredAfter.getRewardPoints(), "Referred user should get 10 points");
        assertEquals(refCode, referredAfter.getReferredBy(), "Referred user's referredBy field should match referrer's code");
    }
}
