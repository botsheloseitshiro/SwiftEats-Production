package com.swifteats.swifteats.dto.order;

import com.swifteats.swifteats.model.Order;
import com.swifteats.swifteats.model.OrderItem;
import com.swifteats.swifteats.model.RefundStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private Long restaurantId;
    private String restaurantName;
    private String status;
    private BigDecimal totalAmount;
    private BigDecimal subtotalAmount;
    private BigDecimal deliveryFee;
    private BigDecimal tipAmount;
    private String deliveryAddress;
    private String notes;
    private String fulfillmentType;
    private String paymentMethod;
    private String cardType;
    private String cardLastFour;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItemResponse> items;

    /** Driver name if one has been assigned, otherwise null */
    private Long driverId;
    private String driverName;
    private String driverVehicleType;
    private String driverLicensePlate;
    private boolean driverDetailsVisible;
    private String driverAssignmentStatus;
    private LocalDateTime scheduledFor;
    private RefundStatus refundStatus;

    /**
     * Inner DTO for each line item in the order response.
     * Mirrors the OrderItem entity fields.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemResponse {
        private Long id;
        private Long menuItemId;
        private String itemName;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal subtotal;
    }

    public static OrderResponse fromEntity(Order order) {
        // Convert each OrderItem entity to an OrderItemResponse DTO
        List<OrderItemResponse> itemResponses = order.getOrderItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .menuItemId(item.getMenuItem().getId())
                        .itemName(item.getItemName())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        boolean showDriverDetails = order.getDriver() != null
                && order.getStatus() != null
                && order.getStatus().ordinal() >= com.swifteats.swifteats.model.OrderStatus.CONFIRMED.ordinal()
                && order.getStatus() != com.swifteats.swifteats.model.OrderStatus.CANCELLED;

        return OrderResponse.builder()
                .id(order.getId())
                .restaurantId(order.getRestaurant().getId())
                .restaurantName(order.getRestaurant().getName())
                .status(order.getStatus().name())
                .totalAmount(order.getTotalAmount())
                .subtotalAmount(order.getSubtotalAmount())
                .deliveryFee(order.getDeliveryFee())
                .tipAmount(order.getTipAmount())
                .deliveryAddress(order.getDeliveryAddress())
                .notes(order.getNotes())
                .fulfillmentType(order.getFulfillmentType().name())
                .paymentMethod(order.getPaymentMethod().name())
                .cardType(order.getCardType() != null ? order.getCardType().name() : null)
                .cardLastFour(order.getCardLastFour())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(itemResponses)
                .driverId(order.getDriver() != null ? order.getDriver().getId() : null)
                .driverName(showDriverDetails && order.getDriver() != null
                        ? order.getDriver().getUser().getFullName()
                        : null)
                .driverVehicleType(showDriverDetails && order.getDriver() != null
                        ? order.getDriver().getVehicleType()
                        : null)
                .driverLicensePlate(showDriverDetails && order.getDriver() != null
                        ? order.getDriver().getLicensePlate()
                        : null)
                .driverDetailsVisible(showDriverDetails)
                .driverAssignmentStatus(order.getDriverAssignmentStatus() != null ? order.getDriverAssignmentStatus().name() : null)
                .scheduledFor(order.getScheduledFor())
                .refundStatus(order.getRefundStatus())
                .build();
    }
}
