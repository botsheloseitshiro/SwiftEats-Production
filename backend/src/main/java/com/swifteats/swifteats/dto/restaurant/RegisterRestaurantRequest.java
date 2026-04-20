package com.swifteats.swifteats.dto.restaurant;

import com.swifteats.swifteats.validation.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRestaurantRequest {

    @NotBlank(message = "Restaurant name is required")
    @Size(min = 2, max = 150, message = "Name must be 2-150 characters")
    private String name;

    @Size(max = 500, message = "Description too long")
    private String description;

    @NotBlank(message = "Restaurant address is required")
    @Size(min = 5, max = 300, message = "Address must be 5-300 characters")
    private String address;

    private String city;

    private Double latitude;

    private Double longitude;

    private Double deliveryRadiusKm;

    @NotBlank(message = "Category is required")
    @Size(max = 100)
    private String category;

    @Size(max = 500, message = "Image URL too long")
    private String imageUrl;

    @Positive(message = "Delivery time must be positive")
    private Integer deliveryTimeMinutes;

    @Positive(message = "Delivery fee must be positive")
    private BigDecimal deliveryFee;

    // === RESTAURANT ADMIN ACCOUNT (created by admin) ===

    @NotBlank(message = "Admin full name is required")
    @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
    private String adminFullName;

    @NotBlank(message = "Admin email is required")
    @Email(message = "Invalid email format")
    private String adminEmail;

    @NotBlank(message = "Admin password is required")
    @ValidPassword
    private String adminPassword;
}
