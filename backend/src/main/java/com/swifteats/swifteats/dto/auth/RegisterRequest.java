package com.swifteats.swifteats.dto.auth;

import com.swifteats.swifteats.validation.ValidPassword;
import com.swifteats.swifteats.validation.ValidPhoneNumber;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @ValidPassword
    private String password;

    @ValidPhoneNumber
    private String phoneNumber;

    private String address;
}
