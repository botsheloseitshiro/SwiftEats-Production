package com.swifteats.swifteats.dto.auth;

import com.swifteats.swifteats.validation.ValidPassword;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Reset token is required")
    private String token;

    @NotBlank(message = "New password is required")
    @ValidPassword
    private String newPassword;
}
