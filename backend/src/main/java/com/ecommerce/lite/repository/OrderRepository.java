package com.ecommerce.lite.repository;

import com.ecommerce.lite.model.Order;
import com.ecommerce.lite.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);
    long countByUserId(Long userId);
    List<Order> findByStatus(OrderStatus status);
    java.util.Optional<Order> findByTrackingNumberIgnoreCase(String trackingNumber);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = com.ecommerce.lite.model.OrderStatus.PAID OR o.status = com.ecommerce.lite.model.OrderStatus.SHIPPED OR o.status = com.ecommerce.lite.model.OrderStatus.DELIVERED")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = com.ecommerce.lite.model.OrderStatus.PENDING")
    long countPendingOrders();
}
