package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.auth.RefreshTokenRequest;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class AuthServiceTest {

    @Test
    void logoutShouldRevokeRefreshToken() {
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
        com.swifteats.swifteats.config.JwtTokenProvider jwtTokenProvider = mock(com.swifteats.swifteats.config.JwtTokenProvider.class);
        RefreshTokenService refreshTokenService = mock(RefreshTokenService.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        NotificationService notificationService = mock(NotificationService.class);

        AuthService service = new AuthService(userRepository, passwordEncoder, authenticationManager, jwtTokenProvider, refreshTokenService, auditLogService, notificationService);

        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("refresh-token");

        service.logout(request);

        verify(refreshTokenService).revokeRefreshToken("refresh-token");
    }
}
