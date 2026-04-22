package com.swifteats.swifteats.dto.driver;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateDriverRequest {

    @NotBlank
    @Size(min = 2, max = 100)
    private String fullName;

    @NotBlank
    @Email
    private String email;

    @Size(max = 20)
    private String phoneNumber;

    @Size(max = 500)
    private String address;

    @Size(max = 50)
    private String vehicleType;

    @Size(max = 20)
    private String licensePlate;
}
