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
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

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

    @PostMapping(value = "/public/verify-payment-redirect/{id}", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<Void> verifyPaymentRedirect(
            @PathVariable Long id,
            @RequestParam(value = "razorpay_payment_id", required = false) String razorpayPaymentId,
            @RequestParam(value = "razorpay_order_id", required = false) String razorpayOrderId,
            @RequestParam(value = "razorpay_signature", required = false) String razorpaySignature,
            @RequestParam(value = "error[code]", required = false) String errorCode,
            @RequestParam(value = "error[description]", required = false) String errorDesc) {
        
        HttpHeaders headers = new HttpHeaders();
        try {
            if (errorCode != null || errorDesc != null) {
                String error = errorDesc != null ? errorDesc : "Payment failed";
                headers.setLocation(java.net.URI.create("http://localhost:5173/checkout?error=" + java.net.URLEncoder.encode(error, java.nio.charset.StandardCharsets.UTF_8)));
                return new ResponseEntity<>(headers, HttpStatus.SEE_OTHER);
            }
            
            Order order = orderService.verifyPayment(id, razorpayPaymentId, razorpayOrderId, razorpaySignature, "TXN_RAZORPAY");
            headers.setLocation(java.net.URI.create("http://localhost:5173/checkout-success?orderId=" + order.getId() + "&orderNumber=" + (order.getOrderNumber() != null ? order.getOrderNumber() : order.getId()) + "&trackingNumber=" + order.getTrackingNumber()));
        } catch (Exception e) {
            headers.setLocation(java.net.URI.create("http://localhost:5173/checkout?error=" + java.net.URLEncoder.encode(e.getMessage() != null ? e.getMessage() : "Payment verification failed", java.nio.charset.StandardCharsets.UTF_8)));
        }
        return new ResponseEntity<>(headers, HttpStatus.SEE_OTHER);
    }

    @GetMapping("/public/track/{trackingNumber}")
    public ResponseEntity<Map<String, Object>> trackOrder(@PathVariable String trackingNumber) {
        Order order = orderService.getOrderByTrackingNumber(trackingNumber);
        Map<String, Object> response = new HashMap<>();
        response.put("id", order.getId());
        response.put("status", order.getStatus());
        response.put("orderDate", order.getOrderDate());
        response.put("totalAmount", order.getTotalAmount());
        response.put("trackingNumber", order.getTrackingNumber());
        
        Map<String, Object> addr = new HashMap<>();
        addr.put("city", order.getShippingAddress().getCity());
        addr.put("state", order.getShippingAddress().getState());
        addr.put("country", order.getShippingAddress().getCountry());
        response.put("shippingAddress", addr);
        
        List<Map<String, Object>> items = new ArrayList<>();
        for (com.ecommerce.lite.model.OrderItem item : order.getOrderItems()) {
            Map<String, Object> it = new HashMap<>();
            it.put("productName", item.getProduct().getName());
            it.put("quantity", item.getQuantity());
            it.put("price", item.getPrice());
            it.put("imageUrl", item.getProduct().getImageUrl());
            items.add(it);
        }
        response.put("orderItems", items);
        
        return ResponseEntity.ok(response);
    }
}
