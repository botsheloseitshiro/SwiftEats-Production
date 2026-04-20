package com.swifteats.swifteats.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private long expiresIn;
    private Long userId;
    private String fullName;
    private String email;
    private String role;
}
