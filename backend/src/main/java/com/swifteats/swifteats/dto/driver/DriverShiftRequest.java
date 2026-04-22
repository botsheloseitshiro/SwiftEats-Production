package com.swifteats.swifteats.dto.driver;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DriverShiftRequest {
    @NotNull
    private Boolean online;
}
