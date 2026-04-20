package com.swifteats.swifteats.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedAddressRequest {

    @NotBlank(message = "Address label is required")
    @Size(max = 100, message = "Address label must be at most 100 characters")
    private String label;

    @NotBlank(message = "Address is required")
    @Size(max = 500, message = "Address must be at most 500 characters")
    private String addressLine;

    @Builder.Default
    private boolean isDefault = false;
}
