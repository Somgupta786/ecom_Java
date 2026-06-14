package com.ecommerce.lite.dto;

import com.ecommerce.lite.model.Address;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CheckoutRequest {
    @NotNull(message = "Shipping address is required")
    private Address shippingAddress;

    private String couponCode;
    
    private boolean usePoints;

    private String paymentMethod;
}
