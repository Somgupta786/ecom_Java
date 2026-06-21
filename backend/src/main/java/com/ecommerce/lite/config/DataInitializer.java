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
import java.util.List;
import java.util.ArrayList;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final PasswordEncoder passwordEncoder;
    private final SynonymRepository synonymRepository;

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

        // Seed 25 additional products if total products <= 6
        if (productRepository.count() <= 6) {
            Category electronics = categoryRepository.findByName("Electronics").orElseGet(() -> categoryRepository.save(Category.builder().name("Electronics").build()));
            Category clothing = categoryRepository.findByName("Clothing").orElseGet(() -> categoryRepository.save(Category.builder().name("Clothing").build()));
            Category home = categoryRepository.findByName("Home & Living").orElseGet(() -> categoryRepository.save(Category.builder().name("Home & Living").build()));

            List<Product> newProds = new ArrayList<>();
            
            // Electronics (10 items)
            newProds.add(Product.builder()
                    .name("AeroGlow Mechanical Keyboard")
                    .description("Premium customizable mechanical keyboard with dynamic RGB backlighting and tactile brown switches.")
                    .price(new BigDecimal("149.99"))
                    .sku("ELEC-KEYB-010")
                    .stock(20)
                    .imageUrl("https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500")
                    .category(electronics)
                    .rating(4.7)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("CyberVision Gaming Monitor")
                    .description("27-inch QHD curved gaming monitor with 165Hz refresh rate, 1ms response time, and HDR support.")
                    .price(new BigDecimal("329.99"))
                    .sku("ELEC-MONI-011")
                    .stock(15)
                    .imageUrl("https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500")
                    .category(electronics)
                    .rating(4.6)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Helix Noise-Cancelling Earbuds")
                    .description("True wireless earbuds with active noise cancellation, ambient awareness, and touch controls.")
                    .price(new BigDecimal("89.99"))
                    .sku("ELEC-EARB-012")
                    .stock(35)
                    .imageUrl("https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500")
                    .category(electronics)
                    .rating(4.4)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("SyncBand Fitness Tracker")
                    .description("Sleek smart band tracking heart rate, sleep patterns, active minutes, and smartphone alerts.")
                    .price(new BigDecimal("49.99"))
                    .sku("ELEC-FITN-013")
                    .stock(40)
                    .imageUrl("https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500")
                    .category(electronics)
                    .rating(4.2)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("TitanCharge Power Bank")
                    .description("20000mAh high-capacity portable charger with 22.5W fast delivery and multi-device inputs.")
                    .price(new BigDecimal("29.99"))
                    .sku("ELEC-PWR-014")
                    .stock(50)
                    .imageUrl("https://images.unsplash.com/photo-1609592806453-6a4134b3ff2c?w=500")
                    .category(electronics)
                    .rating(4.5)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Nova Smart LED Bulb Pack")
                    .description("Pack of 4 smart Wi-Fi LED light bulbs, multicolor and tunable white, working with voice control.")
                    .price(new BigDecimal("39.99"))
                    .sku("ELEC-BULB-015")
                    .stock(30)
                    .imageUrl("https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=500")
                    .category(electronics)
                    .rating(4.3)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Chrono Steel Smartwatch")
                    .description("Premium steel smartwatch featuring step counting, GPS, continuous vitals tracking, and a 10-day battery.")
                    .price(new BigDecimal("179.99"))
                    .sku("ELEC-WTCH-016")
                    .stock(18)
                    .imageUrl("https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500")
                    .category(electronics)
                    .rating(4.8)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Infinity Induction Cooktop")
                    .description("Portable counter induction cooktop with digital timer, sensor controls, and 8 temperature settings.")
                    .price(new BigDecimal("95.00"))
                    .sku("ELEC-COOK-017")
                    .stock(12)
                    .imageUrl("https://images.unsplash.com/photo-1626379616459-b2ce1d9decbc?w=500")
                    .category(electronics)
                    .rating(4.5)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Aura Soundbar System")
                    .description("Sleek home theater soundbar with bluetooth connectivity, deep bass subwoofer, and rich cinema audio.")
                    .price(new BigDecimal("199.99"))
                    .sku("ELEC-SND-018")
                    .stock(8)
                    .imageUrl("https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500")
                    .category(electronics)
                    .rating(4.6)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Spectra VR Headset")
                    .description("Standalone virtual reality headset with stunning display, spatial audio, and active motion controllers.")
                    .price(new BigDecimal("299.99"))
                    .sku("ELEC-VRHD-019")
                    .stock(5)
                    .imageUrl("https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=500")
                    .category(electronics)
                    .rating(4.7)
                    .reviewCount(0)
                    .build());

            // Clothing (8 items)
            newProds.add(Product.builder()
                    .name("Luxe Wool Overcoat")
                    .description("Tailored wool overcoat crafted for warmth and style. Features premium lapel collars and internal pockets.")
                    .price(new BigDecimal("199.99"))
                    .sku("CLOT-OVER-020")
                    .stock(15)
                    .imageUrl("https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500")
                    .category(clothing)
                    .rating(4.8)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Cashmere Knit Sweater")
                    .description("Ultra-soft pure cashmere knit crewneck sweater, lightweight yet exceptionally warm.")
                    .price(new BigDecimal("110.00"))
                    .sku("CLOT-SWTR-021")
                    .stock(20)
                    .imageUrl("https://images.unsplash.com/photo-1574164904299-3a102b110380?w=500")
                    .category(clothing)
                    .rating(4.7)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Denim Heritage Jacket")
                    .description("Classic rigid denim jacket with button chest pockets, adjustable side tabs, and vintage wash styling.")
                    .price(new BigDecimal("68.00"))
                    .sku("CLOT-JCKT-022")
                    .stock(25)
                    .imageUrl("https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=500")
                    .category(clothing)
                    .rating(4.4)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("AeroFit Running Shorts")
                    .description("Breathable dry-fit workout shorts with built-in briefs, zippered side pocket, and split leg vents.")
                    .price(new BigDecimal("35.00"))
                    .sku("CLOT-SHRT-023")
                    .stock(40)
                    .imageUrl("https://images.unsplash.com/photo-1539185441755-769473a23570?w=500")
                    .category(clothing)
                    .rating(4.1)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Signature Leather Belt")
                    .description("Classic dress belt crafted from vegetable tanned cowhide leather with a brushed nickel buckle.")
                    .price(new BigDecimal("45.00"))
                    .sku("CLOT-BELT-024")
                    .stock(30)
                    .imageUrl("https://images.unsplash.com/photo-1624224971170-2f84fed5eb5e?w=500")
                    .category(clothing)
                    .rating(4.5)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Silk Sleepwear Set")
                    .description("Luxurious mulberry silk pajamas set. Features button-up collared top and elastic waist pants.")
                    .price(new BigDecimal("85.00"))
                    .sku("CLOT-SLP-025")
                    .stock(15)
                    .imageUrl("https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500")
                    .category(clothing)
                    .rating(4.6)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Atlas Travel Backpack")
                    .description("Water-repellent anti-theft laptop backpack with USB charging port and luggage sleeve.")
                    .price(new BigDecimal("120.00"))
                    .sku("CLOT-PACK-026")
                    .stock(22)
                    .imageUrl("https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500")
                    .category(clothing)
                    .rating(4.7)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Urban Shield Umbrella")
                    .description("Windproof automatic travel umbrella, reinforced fiberglass ribs, Teflon coating for quick drying.")
                    .price(new BigDecimal("25.00"))
                    .sku("CLOT-UMBR-027")
                    .stock(50)
                    .imageUrl("https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=500")
                    .category(clothing)
                    .rating(4.3)
                    .reviewCount(0)
                    .build());

            // Home & Living (7 items)
            newProds.add(Product.builder()
                    .name("Luna Ceramic Dinnerware Set")
                    .description("16-piece stoneware dinner set with reactive glaze. Includes plates, salad plates, soup bowls, and mugs.")
                    .price(new BigDecimal("135.00"))
                    .sku("HOME-DINN-028")
                    .stock(12)
                    .imageUrl("https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500")
                    .category(home)
                    .rating(4.6)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Solstice Amber Soy Candle")
                    .description("Hand-poured candle in an amber glass jar, scented with natural cedarwood and warm amber oils.")
                    .price(new BigDecimal("18.50"))
                    .sku("HOME-CNDL-029")
                    .stock(100)
                    .imageUrl("https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500")
                    .category(home)
                    .rating(4.8)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Elysian Velvet Pillow")
                    .description("Plush velvet throw pillow with soft feather insert, adding a splash of premium texture to sofas.")
                    .price(new BigDecimal("28.00"))
                    .sku("HOME-PILL-030")
                    .stock(45)
                    .imageUrl("https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?w=500")
                    .category(home)
                    .rating(4.5)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Orion Brass Desk Lamp")
                    .description("Mid-century modern metal desk lamp with antique brass finish and adjustable shade head.")
                    .price(new BigDecimal("79.99"))
                    .sku("HOME-LAMP-031")
                    .stock(18)
                    .imageUrl("https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500")
                    .category(home)
                    .rating(4.7)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Zen Woven Bamboo Hamper")
                    .description("Eco-friendly woven bamboo laundry hamper with dual compartments and removable cotton liners.")
                    .price(new BigDecimal("42.00"))
                    .sku("HOME-HMPR-032")
                    .stock(25)
                    .imageUrl("https://images.unsplash.com/photo-1528938102132-4a9276b8e320?w=500")
                    .category(home)
                    .rating(4.4)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Meridian Wool Area Rug")
                    .description("Flat-weave geometric area rug, handcrafted from 100% natural organic wool fiber yarns.")
                    .price(new BigDecimal("249.99"))
                    .sku("HOME-RRUG-033")
                    .stock(8)
                    .imageUrl("https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=500")
                    .category(home)
                    .rating(4.9)
                    .reviewCount(0)
                    .build());

            newProds.add(Product.builder()
                    .name("Bespoke Walnut Cutting Board")
                    .description("Reversible end-grain walnut cutting board with side handles and juice grooves.")
                    .price(new BigDecimal("65.00"))
                    .sku("HOME-BOARD-034")
                    .stock(15)
                    .imageUrl("https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=500")
                    .category(home)
                    .rating(4.7)
                    .reviewCount(0)
                    .build());

            productRepository.saveAll(newProds);
        }

        // 3. Seed Default Coupon
        if (couponRepository.findByCodeIgnoreCase("SALETIME10").isEmpty()) {
            Coupon welcomeCoupon = Coupon.builder()
                    .code("SALETIME10")
                    .discountPercent(10)
                    .isActive(true)
                    .expiryDate(LocalDateTime.now().plusMonths(3))
                    .build();
            couponRepository.save(welcomeCoupon);
        }

        // 4. Seed Dummy T-Shirt and Tee products for strict synonym search testing
        if (productRepository.count() > 0) {
            Category clothing = categoryRepository.findByName("Clothing").orElseGet(() -> categoryRepository.save(Category.builder().name("Clothing").build()));
            List<Product> testProducts = new ArrayList<>();
            
            if (productRepository.findAll().stream().noneMatch(p -> p.getSku().equals("CLOT-TEE-050"))) {
                testProducts.add(Product.builder()
                        .name("Organic Cotton Slub Tee")
                        .description("A lightweight organic cotton tee with a textured slub finish. Essential casual summer top.")
                        .price(new BigDecimal("28.00"))
                        .sku("CLOT-TEE-050")
                        .stock(30)
                        .imageUrl("https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500")
                        .category(clothing)
                        .rating(4.5)
                        .reviewCount(0)
                        .build());
            }

            if (productRepository.findAll().stream().noneMatch(p -> p.getSku().equals("CLOT-TSH-051"))) {
                testProducts.add(Product.builder()
                        .name("Vintage Graphic T-Shirt")
                        .description("Soft vintage washed graphic t-shirt featuring retro prints. Ribbed neck band and loose fit.")
                        .price(new BigDecimal("35.00"))
                        .sku("CLOT-TSH-051")
                        .stock(25)
                        .imageUrl("https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500")
                        .category(clothing)
                        .rating(4.3)
                        .reviewCount(0)
                        .build());
            }
            
            if (productRepository.findAll().stream().noneMatch(p -> p.getSku().equals("CLOT-TEE-052"))) {
                testProducts.add(Product.builder()
                        .name("Pima Cotton Crewneck Tee")
                        .description("Premium extra-long staple Pima cotton tee. Exceptionally smooth, durable, and breathable.")
                        .price(new BigDecimal("38.00"))
                        .sku("CLOT-TEE-052")
                        .stock(40)
                        .imageUrl("https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500")
                        .category(clothing)
                        .rating(4.7)
                        .reviewCount(0)
                        .build());
            }

            if (productRepository.findAll().stream().noneMatch(p -> p.getSku().equals("CLOT-TSH-053"))) {
                testProducts.add(Product.builder()
                        .name("Athletic Moisture-Wicking T-Shirt")
                        .description("High performance athletic training shirt. Quick-dry lightweight polyester knit fabric.")
                        .price(new BigDecimal("42.00"))
                        .sku("CLOT-TSH-053")
                        .stock(35)
                        .imageUrl("https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500")
                        .category(clothing)
                        .rating(4.6)
                        .reviewCount(0)
                        .build());
            }

            if (!testProducts.isEmpty()) {
                productRepository.saveAll(testProducts);
            }
        }

        // 5. Seed Default Synonym mapping (tshirt <-> tee)
        if (synonymRepository.count() == 0) {
            Synonym defaultSynonym = Synonym.builder()
                    .term("tshirt")
                    .synonym("tee")
                    .build();
            synonymRepository.save(defaultSynonym);
        }
    }
}
