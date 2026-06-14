package com.ecommerce.lite.controller;

import com.ecommerce.lite.dto.DashboardStats;
import com.ecommerce.lite.model.Category;
import com.ecommerce.lite.model.Order;
import com.ecommerce.lite.model.OrderStatus;
import com.ecommerce.lite.model.Product;
import com.ecommerce.lite.repository.CategoryRepository;
import com.ecommerce.lite.repository.OrderRepository;
import com.ecommerce.lite.repository.ProductRepository;
import com.ecommerce.lite.repository.UserRepository;
import com.ecommerce.lite.service.OrderService;
import com.ecommerce.lite.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final OrderService orderService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStats> getStats() {
        DashboardStats stats = DashboardStats.builder()
                .totalRevenue(orderRepository.calculateTotalRevenue())
                .totalUsers(userRepository.count())
                .pendingOrders(orderRepository.countPendingOrders())
                .outOfStockProducts(productRepository.countByStockLessThanEqual(0))
                .build();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestParam OrderStatus status) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        return ResponseEntity.ok(productService.createProduct(product));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        return ResponseEntity.ok(productService.updateProduct(id, product));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok("{ \"message\": \"Product deleted successfully\" }");
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        return ResponseEntity.ok(productService.createCategory(category));
    }
}
