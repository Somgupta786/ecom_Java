package com.ecommerce.lite.controller;

import com.ecommerce.lite.model.CartItem;
import com.ecommerce.lite.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<List<CartItem>> getCart(Principal principal) {
        return ResponseEntity.ok(cartService.getCartByUser(principal.getName()));
    }

    @PostMapping("/add")
    public ResponseEntity<CartItem> addToCart(
            Principal principal,
            @RequestParam Long productId,
            @RequestParam(defaultValue = "1") int quantity) {
        return ResponseEntity.ok(cartService.addToCart(principal.getName(), productId, quantity));
    }

    @PutMapping("/update/{cartItemId}")
    public ResponseEntity<CartItem> updateCartItem(
            Principal principal,
            @PathVariable Long cartItemId,
            @RequestParam int quantity) {
        return ResponseEntity.ok(cartService.updateCartItem(principal.getName(), cartItemId, quantity));
    }

    @DeleteMapping("/remove/{cartItemId}")
    public ResponseEntity<?> removeFromCart(Principal principal, @PathVariable Long cartItemId) {
        cartService.removeFromCart(principal.getName(), cartItemId);
        return ResponseEntity.ok("{ \"message\": \"Item removed successfully\" }");
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(Principal principal) {
        cartService.clearCart(principal.getName());
        return ResponseEntity.ok("{ \"message\": \"Cart cleared successfully\" }");
    }
}
