package com.ecommerce.lite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private BigDecimal totalRevenue;
    private long totalUsers;
    private long pendingOrders;
    private long outOfStockProducts;
}
