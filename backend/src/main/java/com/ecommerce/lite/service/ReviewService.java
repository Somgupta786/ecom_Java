package com.ecommerce.lite.service;

import com.ecommerce.lite.dto.ReviewRequest;
import com.ecommerce.lite.model.*;
import com.ecommerce.lite.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public List<Review> getReviewsByProduct(Long productId) {
        return reviewRepository.findByProductId(productId);
    }

    @Transactional
    @CacheEvict(value = "products", key = "#productId")
    public Review addReview(String email, Long productId, ReviewRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        // Check if verified purchase: exists a PAID/SHIPPED/DELIVERED order with this product
        boolean isVerified = false;
        List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(user.getId());
        for (Order order : orders) {
            if (order.getStatus() == OrderStatus.PAID || order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
                boolean hasProduct = order.getOrderItems().stream()
                        .anyMatch(item -> item.getProduct().getId().equals(productId));
                if (hasProduct) {
                    isVerified = true;
                    break;
                }
            }
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(request.getRating())
                .comment(request.getComment())
                .verifiedPurchase(isVerified)
                .build();

        Review savedReview = reviewRepository.save(review);

        // Update Product average rating and count
        List<Review> reviews = reviewRepository.findByProductId(productId);
        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        product.setRating(Math.round(avg * 10.0) / 10.0); // round to 1 decimal place
        product.setReviewCount(reviews.size());
        productRepository.save(product);

        return savedReview;
    }
}
