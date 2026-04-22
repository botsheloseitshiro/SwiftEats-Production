package com.swifteats.swifteats.dto.driver;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DriverLocationUpdateRequest {
    @NotNull
    private Double latitude;
    @NotNull
    private Double longitude;
}
