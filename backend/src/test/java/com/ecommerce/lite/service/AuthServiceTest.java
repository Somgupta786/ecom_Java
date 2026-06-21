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

    @Test
    public void testAddressEditAndDelete() {
        // Create user
        RegisterRequest req = new RegisterRequest();
        req.setEmail("addressuser@example.com");
        req.setPassword("password123");
        req.setFirstName("Address");
        req.setLastName("User");
        authService.register(req);

        User user = userRepository.findByEmail("addressuser@example.com").orElseThrow();
        
        // 1. Add Address
        com.ecommerce.lite.model.Address address1 = com.ecommerce.lite.model.Address.builder()
                .street("123 Main St")
                .city("New York")
                .state("NY")
                .zipCode("10001")
                .country("USA")
                .phone("1234567890")
                .build();
        
        user.getAddresses().add(address1);
        userRepository.save(user);

        User savedUser = userRepository.findByEmail("addressuser@example.com").orElseThrow();
        assertEquals(1, savedUser.getAddresses().size());

        // 2. Edit Address
        com.ecommerce.lite.model.Address address2 = com.ecommerce.lite.model.Address.builder()
                .street("456 Broad St")
                .city("Boston")
                .state("MA")
                .zipCode("02108")
                .country("USA")
                .phone("0987654321")
                .build();
        
        savedUser.getAddresses().set(0, address2);
        userRepository.save(savedUser);

        User editedUser = userRepository.findByEmail("addressuser@example.com").orElseThrow();
        assertEquals(1, editedUser.getAddresses().size());
        assertEquals("456 Broad St", editedUser.getAddresses().get(0).getStreet());

        // 3. Delete Address
        editedUser.getAddresses().remove(0);
        userRepository.save(editedUser);

        User deletedUser = userRepository.findByEmail("addressuser@example.com").orElseThrow();
        assertEquals(0, deletedUser.getAddresses().size());
    }

    @Test
    public void testInvalidReferralCodeThrowsException() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("invalidref@example.com");
        req.setPassword("password123");
        req.setFirstName("Invalid");
        req.setLastName("Ref");
        req.setReferredBy("NONEXISTENTCODE");

        assertThrows(IllegalArgumentException.class, () -> {
            authService.register(req);
        }, "Should throw exception for nonexistent referral code");
    }
}
