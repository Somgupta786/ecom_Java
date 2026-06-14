package com.ecommerce.lite.controller;

import com.ecommerce.lite.dto.CheckoutRequest;
import com.ecommerce.lite.model.Order;
import com.ecommerce.lite.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<Order> placeOrder(Principal principal, @Valid @RequestBody CheckoutRequest request) {
        return ResponseEntity.ok(orderService.placeOrder(principal.getName(), request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Order>> getHistory(Principal principal) {
        return ResponseEntity.ok(orderService.getOrderHistory(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(Principal principal, @PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id, principal.getName()));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(Principal principal, @PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id, principal.getName()));
    }

    @PostMapping("/{id}/verify-payment")
    public ResponseEntity<Order> verifyPayment(
            @PathVariable Long id,
            @RequestParam(required = false) String razorpayPaymentId,
            @RequestParam(required = false) String razorpayOrderId,
            @RequestParam(required = false) String razorpaySignature,
            @RequestParam(defaultValue = "TXN_SIMULATED") String transactionId) {
        return ResponseEntity.ok(orderService.verifyPayment(id, razorpayPaymentId, razorpayOrderId, razorpaySignature, transactionId));
    }

    @GetMapping("/{id}/invoice")
    public ResponseEntity<String> getInvoice(@PathVariable Long id, Principal principal) {
        // Find order first (checks permissions)
        Order order = orderService.getOrderById(id, principal.getName());
        String htmlContent = orderService.generateInvoiceHtml(order);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_HTML);
        
        return new ResponseEntity<>(htmlContent, headers, HttpStatus.OK);
    }
}
