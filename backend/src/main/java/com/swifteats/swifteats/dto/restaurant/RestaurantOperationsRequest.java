package com.swifteats.swifteats.dto.restaurant;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RestaurantOperationsRequest {
    private Boolean acceptingOrders;
    private LocalDateTime pauseOrdersUntil;
    private String holidayHours;
}
