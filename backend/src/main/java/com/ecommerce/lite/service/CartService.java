package com.ecommerce.lite.service;

import com.ecommerce.lite.model.CartItem;
import com.ecommerce.lite.model.Product;
import com.ecommerce.lite.model.User;
import com.ecommerce.lite.repository.CartItemRepository;
import com.ecommerce.lite.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductService productService;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CartItem> getCartByUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return cartItemRepository.findByUserId(user.getId());
    }

    @Transactional
    public CartItem addToCart(String email, Long productId, int quantity) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Product product = productService.getProductById(productId);

        if (product.getStock() < quantity) {
            throw new IllegalArgumentException("Requested quantity exceeds available stock");
        }

        Optional<CartItem> existingItemOpt = cartItemRepository.findByUserIdAndProductId(user.getId(), productId);
        CartItem cartItem;
        if (existingItemOpt.isPresent()) {
            cartItem = existingItemOpt.get();
            cartItem.setQuantity(cartItem.getQuantity() + quantity);
        } else {
            cartItem = CartItem.builder()
                    .user(user)
                    .product(product)
                    .quantity(quantity)
                    .build();
        }

        return cartItemRepository.save(cartItem);
    }

    @Transactional
    public CartItem updateCartItem(String email, Long cartItemId, int quantity) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));

        if (!item.getUser().getEmail().equals(email)) {
            throw new SecurityException("Unauthorized modification of cart item");
        }

        if (item.getProduct().getStock() < quantity) {
            throw new IllegalArgumentException("Requested quantity exceeds available stock");
        }

        item.setQuantity(quantity);
        return cartItemRepository.save(item);
    }

    @Transactional
    public void removeFromCart(String email, Long cartItemId) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));

        if (!item.getUser().getEmail().equals(email)) {
            throw new SecurityException("Unauthorized modification of cart item");
        }

        cartItemRepository.delete(item);
    }

    @Transactional
    public void clearCart(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        cartItemRepository.deleteByUserId(user.getId());
    }
}
