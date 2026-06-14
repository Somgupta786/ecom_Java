package com.ecommerce.lite.config;

import com.ecommerce.lite.model.*;
import com.ecommerce.lite.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Admin User
        if (!userRepository.existsByEmail("admin@ecommerce.com")) {
            User admin = User.builder()
                    .email("admin@ecommerce.com")
                    .password(passwordEncoder.encode("admin123"))
                    .firstName("Store")
                    .lastName("Admin")
                    .role(UserRole.ROLE_ADMIN)
                    .referralCode("ADMINREF")
                    .rewardPoints(100)
                    .isActive(true)
                    .build();
            userRepository.save(admin);
        }

        // 2. Seed Regular User
        if (!userRepository.existsByEmail("user@ecommerce.com")) {
            User user = User.builder()
                    .email("user@ecommerce.com")
                    .password(passwordEncoder.encode("user123"))
                    .firstName("Regular")
                    .lastName("User")
                    .role(UserRole.ROLE_USER)
                    .referralCode("USERREF")
                    .rewardPoints(0)
                    .isActive(true)
                    .build();
            userRepository.save(user);
        }

        // 2. Seed Default Categories & Products
        if (categoryRepository.count() == 0) {
            Category electronics = Category.builder().name("Electronics").build();
            Category clothing = Category.builder().name("Clothing").build();
            Category home = Category.builder().name("Home & Living").build();

            categoryRepository.saveAll(Arrays.asList(electronics, clothing, home));

            // Products for Electronics
            Product p1 = Product.builder()
                    .name("Quantum Wireless Headphones")
                    .description("Active noise-cancelling headphones with high-fidelity sound, 40-hour battery life, and comfortable ergonomic earcups.")
                    .price(new BigDecimal("129.99"))
                    .sku("ELEC-HEAD-001")
                    .stock(25)
                    .imageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500")
                    .category(electronics)
                    .rating(4.8)
                    .reviewCount(1)
                    .build();

            Product p2 = Product.builder()
                    .name("VividSmart 4K Projector")
                    .description("Ultra HD home theater projector with 3000 lumens, HDR10 support, and built-in smart TV streaming applications.")
                    .price(new BigDecimal("599.99"))
                    .sku("ELEC-PROJ-002")
                    .stock(10)
                    .imageUrl("https://images.unsplash.com/photo-1535016120720-40c646be5580?w=500")
                    .category(electronics)
                    .rating(4.5)
                    .reviewCount(0)
                    .build();

            // Products for Clothing
            Product p3 = Product.builder()
                    .name("Classic Cotton Trench Coat")
                    .description("Double-breasted weather-resistant cotton trench coat. Elegant silhouette with adjustable waist belt.")
                    .price(new BigDecimal("89.99"))
                    .sku("CLOT-COAT-003")
                    .stock(40)
                    .imageUrl("https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500")
                    .category(clothing)
                    .rating(4.2)
                    .reviewCount(0)
                    .build();

            Product p4 = Product.builder()
                    .name("Minimalist Leather Sneakers")
                    .description("Premium full-grain leather sneakers with vulcanized rubber sole and comfortable memory foam insoles.")
                    .price(new BigDecimal("75.00"))
                    .sku("CLOT-SNEK-004")
                    .stock(30)
                    .imageUrl("https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500")
                    .category(clothing)
                    .rating(4.6)
                    .reviewCount(0)
                    .build();

            // Products for Home
            Product p5 = Product.builder()
                    .name("Handcrafted Ceramic Vase")
                    .description("Artisanal stoneware ceramic vase with a textured matte glaze, perfect for dry flowers or decor.")
                    .price(new BigDecimal("34.50"))
                    .sku("HOME-VASE-005")
                    .stock(15)
                    .imageUrl("https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500")
                    .category(home)
                    .rating(4.0)
                    .reviewCount(0)
                    .build();

            Product p6 = Product.builder()
                    .name("AromaMist Essential Oil Diffuser")
                    .description("Ultrasonic cool mist humidifier and aromatherapy diffuser with 7-color ambient LED lighting.")
                    .price(new BigDecimal("24.99"))
                    .sku("HOME-DIFF-006")
                    .stock(50)
                    .imageUrl("https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500")
                    .category(home)
                    .rating(4.7)
                    .reviewCount(0)
                    .build();

            productRepository.saveAll(Arrays.asList(p1, p2, p3, p4, p5, p6));
        }

        // 3. Seed Default Coupon
        if (couponRepository.count() == 0) {
            Coupon welcomeCoupon = Coupon.builder()
                    .code("WELCOME10")
                    .discountPercent(10)
                    .isActive(true)
                    .expiryDate(LocalDateTime.now().plusMonths(3))
                    .build();
            couponRepository.save(welcomeCoupon);
        }
    }
}
