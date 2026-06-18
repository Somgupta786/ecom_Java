package com.ecommerce.lite.service;

import com.ecommerce.lite.dto.CheckoutRequest;
import com.ecommerce.lite.model.*;
import com.ecommerce.lite.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;


@Service
@RequiredArgsConstructor
public class OrderService {

    @Value("${razorpay.key}")
    private String razorpayKey;

    @Value("${razorpay.secret}")
    private String razorpaySecret;

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;

    @Transactional
    public Order placeOrder(String email, CheckoutRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<CartItem> cartItems = cartItemRepository.findByUserId(user.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            if (product.getStock() < item.getQuantity()) {
                throw new IllegalArgumentException("Stock unavailable for product: " + product.getName());
            }
            BigDecimal itemCost = product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(itemCost);
        }

        // Apply coupon discount
        BigDecimal discount = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().trim().isEmpty()) {
            Coupon coupon = couponRepository.findByCodeIgnoreCase(request.getCouponCode().trim())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid coupon code"));
            if (coupon.isActive() && (coupon.getExpiryDate() == null || coupon.getExpiryDate().isAfter(LocalDateTime.now()))) {
                BigDecimal discountPercent = BigDecimal.valueOf(coupon.getDiscountPercent());
                discount = subtotal.multiply(discountPercent).divide(BigDecimal.valueOf(100), RoundingMode.HALF_UP);
                if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) {
                    discount = coupon.getMaxDiscount();
                }
            }
        }

        // Apply loyalty rewards
        BigDecimal pointsDiscount = BigDecimal.ZERO;
        if (request.isUsePoints() && user.getRewardPoints() > 0) {
            // 10 reward points = $1.00 discount
            BigDecimal pointsVal = BigDecimal.valueOf(user.getRewardPoints()).divide(BigDecimal.valueOf(10), RoundingMode.HALF_UP);
            BigDecimal remainingCost = subtotal.subtract(discount);
            
            if (pointsVal.compareTo(remainingCost) >= 0) {
                pointsDiscount = remainingCost;
                int pointsUsed = remainingCost.multiply(BigDecimal.valueOf(10)).intValue();
                user.setRewardPoints(user.getRewardPoints() - pointsUsed);
            } else {
                pointsDiscount = pointsVal;
                user.setRewardPoints(0);
            }
        }

        BigDecimal netTotal = subtotal.subtract(discount).subtract(pointsDiscount);
        if (netTotal.compareTo(BigDecimal.ZERO) < 0) {
            netTotal = BigDecimal.ZERO;
        }

        // Tax calculation: 5% of Net Total
        BigDecimal tax = netTotal.multiply(BigDecimal.valueOf(0.05)).setScale(2, RoundingMode.HALF_UP);

        // Shipping fee: Free if Net Total > $100, otherwise $10
        BigDecimal shipping = netTotal.compareTo(BigDecimal.valueOf(100.00)) >= 0 ? BigDecimal.ZERO : BigDecimal.valueOf(10.00);

        BigDecimal totalAmount = netTotal.add(tax).add(shipping);

        // Deduct Inventory Stock
        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            product.setStock(product.getStock() - item.getQuantity());
            productRepository.save(product);
        }

        long userOrderCount = orderRepository.countByUserId(user.getId());

        // Build Order
        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .shippingAddress(request.getShippingAddress())
                .totalAmount(totalAmount)
                .orderDate(LocalDateTime.now())
                .trackingNumber("TRK" + java.util.UUID.randomUUID().toString().substring(0, 12).toUpperCase())
                .orderNumber(userOrderCount + 1)
                .build();

        for (CartItem item : cartItems) {
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(item.getProduct())
                    .quantity(item.getQuantity())
                    .price(item.getProduct().getPrice())
                    .build();
            order.getOrderItems().add(orderItem);
        }

        Order savedOrder = orderRepository.save(order);

        // Clear cart
        cartItemRepository.deleteByUserId(user.getId());

        // Earn loyalty points: 1 point for every $10 spent (based on final total amount)
        int earnedPoints = totalAmount.divide(BigDecimal.valueOf(10), RoundingMode.DOWN).intValue();
        user.setRewardPoints(user.getRewardPoints() + earnedPoints);
        userRepository.save(user);

        // Create Razorpay order and save if not COD
        if (!"COD".equalsIgnoreCase(request.getPaymentMethod())) {
            String rzpOrderId = createRazorpayOrder(savedOrder.getId(), savedOrder.getTotalAmount());
            savedOrder.setRazorpayOrderId(rzpOrderId);
            savedOrder.setRazorpayKey(this.razorpayKey);
        } else {
            savedOrder.setRazorpayOrderId("COD");
        }
        
        return orderRepository.save(savedOrder);
    }

    @Transactional
    public Order verifyPayment(Long orderId, String transactionId) {
        return verifyPayment(orderId, null, null, null, transactionId);
    }

    @Transactional
    public Order verifyPayment(Long orderId, String razorpayPaymentId, String razorpayOrderId, String razorpaySignature, String transactionId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (razorpaySignature != null && razorpayPaymentId != null && razorpayOrderId != null) {
            boolean isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
            if (!isValid) {
                throw new IllegalArgumentException("Payment verification failed: Invalid signature");
            }
            order.setStatus(OrderStatus.PAID);
            order.setRazorpayOrderId(razorpayOrderId);
            order.setTrackingNumber("TRK" + razorpayPaymentId.toUpperCase());
        } else {
            order.setStatus(OrderStatus.PAID);
            order.setTrackingNumber("TRK" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
        }
        return orderRepository.save(order);
    }

    private final RestTemplate restTemplate = new RestTemplate();

    private String createRazorpayOrder(Long orderId, BigDecimal usdAmount) {
        try {
            BigDecimal inrAmount = usdAmount.multiply(BigDecimal.valueOf(80));
            long paiseAmount = inrAmount.multiply(BigDecimal.valueOf(100)).longValue();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String authStr = this.razorpayKey + ":" + this.razorpaySecret;
            String base64Auth = Base64.getEncoder().encodeToString(authStr.getBytes(StandardCharsets.UTF_8));
            headers.set("Authorization", "Basic " + base64Auth);

            Map<String, Object> body = new HashMap<>();
            body.put("amount", paiseAmount);
            body.put("currency", "INR");
            body.put("receipt", "order_rcptid_" + orderId);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.razorpay.com/v1/orders",
                request,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK || response.getStatusCode() == HttpStatus.CREATED) {
                Map<String, Object> resBody = response.getBody();
                if (resBody != null && resBody.containsKey("id")) {
                    return (String) resBody.get("id");
                }
            }
        } catch (Exception e) {
            System.err.println("Razorpay Order creation failed: " + e.getMessage());
        }
        return "dummy_rzp_" + UUID.randomUUID().toString().substring(0, 12);
    }

    private boolean verifyRazorpaySignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(this.razorpaySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secretKey);
            byte[] hash = sha256_HMAC.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().equals(signature);
        } catch (Exception e) {
            return false;
        }
    }


    @Transactional(readOnly = true)
    public List<Order> getOrderHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return orderRepository.findByUserIdOrderByOrderDateDesc(user.getId());
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Long orderId, String email) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        if (!order.getUser().getEmail().equals(email) && order.getUser().getRole() != UserRole.ROLE_ADMIN) {
            throw new SecurityException("Unauthorized access to order");
        }
        return order;
    }

    @Transactional
    public Order cancelOrder(Long orderId, String email) {
        Order order = getOrderById(orderId, email);
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PAID) {
            throw new IllegalArgumentException("Cannot cancel order in status: " + order.getStatus());
        }

        // Return stock
        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus(OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public Order getOrderByTrackingNumber(String trackingNumber) {
        return orderRepository.findByTrackingNumberIgnoreCase(trackingNumber)
                .orElseThrow(() -> new IllegalArgumentException("Order with tracking number " + trackingNumber + " not found"));
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        order.setStatus(status);
        return orderRepository.save(order);
    }

    public String generateInvoiceHtml(Order order) {
        StringBuilder sb = new StringBuilder();
        Long displayOrderNo = order.getOrderNumber() != null ? order.getOrderNumber() : order.getId();
        sb.append("<!DOCTYPE html><html><head><title>Invoice #").append(displayOrderNo).append("</title>");
        sb.append("<style>");
        sb.append("body { font-family: 'Inter', sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px; margin: 0; }");
        sb.append(".invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #334155; border-radius: 12px; background-color: #1e293b; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); }");
        sb.append(".header { display: flex; justify-content: space-between; border-bottom: 2px solid #334155; padding-bottom: 20px; }");
        sb.append(".logo { font-size: 24px; font-weight: bold; color: #6366f1; }");
        sb.append(".details { margin-top: 20px; display: flex; justify-content: space-between; }");
        sb.append(".table { width: 100%; border-collapse: collapse; margin-top: 30px; }");
        sb.append(".table th, .table td { border-bottom: 1px solid #334155; padding: 12px; text-align: left; }");
        sb.append(".table th { background-color: #334155; color: #cbd5e1; }");
        sb.append(".totals { margin-top: 25px; text-align: right; font-size: 16px; line-height: 1.6; }");
        sb.append(".totals span { font-weight: bold; color: #6366f1; }");
        sb.append("</style></head><body>");
        sb.append("<div class='invoice-box'>");
        sb.append("<div class='header'>");
        sb.append("<div><div class='logo'>E-Commerce Lite</div><div>Production Grade Receipt</div></div>");
        sb.append("<div style='text-align: right;'><h2>INVOICE</h2>Order #").append(displayOrderNo).append("<br/>Date: ").append(order.getOrderDate().toString().substring(0, 10)).append("</div>");
        sb.append("</div>");
        sb.append("<div class='details'>");
        sb.append("<div><strong>Billed To:</strong><br/>").append(order.getUser().getFirstName()).append(" ").append(order.getUser().getLastName()).append("<br/>").append(order.getUser().getEmail()).append("</div>");
        sb.append("<div><strong>Shipping Address:</strong><br/>")
                .append(order.getShippingAddress().getStreet()).append("<br/>")
                .append(order.getShippingAddress().getCity()).append(", ").append(order.getShippingAddress().getState()).append(" ").append(order.getShippingAddress().getZipCode()).append("<br/>")
                .append(order.getShippingAddress().getCountry()).append("</div>");
        sb.append("</div>");
        sb.append("<table class='table'><thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead><tbody>");
        for (OrderItem item : order.getOrderItems()) {
            BigDecimal itemSub = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            sb.append("<tr><td>").append(item.getProduct().getName()).append("</td>")
                    .append("<td>$").append(item.getPrice()).append("</td>")
                    .append("<td>").append(item.getQuantity()).append("</td>")
                    .append("<td>$").append(itemSub).append("</td></tr>");
        }
        sb.append("</tbody></table>");
        sb.append("<div class='totals'>");
        sb.append("Total Amount: <span>$").append(order.getTotalAmount()).append("</span><br/>");
        sb.append("Payment Status: ").append(order.getStatus().name()).append("<br/>");
        if (order.getTrackingNumber() != null) {
            sb.append("Tracking Number: ").append(order.getTrackingNumber());
        }
        sb.append("</div>");
        sb.append("<div style='margin-top:40px; text-align:center; color:#64748b;'>Thank you for shopping with E-Commerce Lite!</div>");
        sb.append("</div></body></html>");
        return sb.toString();
    }
}
