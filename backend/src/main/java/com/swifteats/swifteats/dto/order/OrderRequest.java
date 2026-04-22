package com.swifteats.swifteats.dto.order;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderRequest {

    @NotNull(message = "Restaurant ID is required")
    private Long restaurantId;

    private String fulfillmentType;
    private String paymentMethod;
    private String deliveryAddress;
    private String notes;
    private BigDecimal tipAmount;
    private LocalDateTime scheduledFor;
    private boolean saveCard;
    private Long savedCardId;
    private PaymentCardRequest card;


    @NotEmpty(message = "Order must contain at least one item")
    private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {

        @NotNull(message = "Menu item ID is required")
        private Long menuItemId;

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be at least 1")
        private Integer quantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentCardRequest {
        private String cardHolderName;
        private String cardNumber;
        private Integer expiryMonth;
        private Integer expiryYear;
    }
}
