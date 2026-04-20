package com.swifteats.swifteats.dto.user;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SavedCardRequest {

    @NotBlank(message = "Card holder name is required")
    private String cardHolderName;

    @NotBlank(message = "Card number is required")
    @Pattern(regexp = "\\d{16}", message = "Card number must contain exactly 16 digits")
    private String cardNumber;

    @NotNull(message = "Expiry month is required")
    @Min(value = 1, message = "Expiry month must be between 1 and 12")
    @Max(value = 12, message = "Expiry month must be between 1 and 12")
    private Integer expiryMonth;

    @NotNull(message = "Expiry year is required")
    @Min(value = 2024, message = "Expiry year is invalid")
    private Integer expiryYear;

    private boolean isDefault;
}
