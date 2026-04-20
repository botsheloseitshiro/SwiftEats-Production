package com.swifteats.swifteats.dto.restaurant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantRegistrationResponse {

    // Restaurant info
    private Long restaurantId;
    private String restaurantName;
    private String restaurantAddress;
    
    // Admin account that was created
    private Long adminUserId;
    private String adminFullName;
    private String adminEmail;

    // Message to show to admin
    private String message;
}
