package com.swifteats.swifteats.service;

import com.swifteats.swifteats.config.JwtTokenProvider;
import com.swifteats.swifteats.dto.auth.JwtResponse;
import com.swifteats.swifteats.dto.auth.LoginRequest;
import com.swifteats.swifteats.dto.auth.RefreshTokenRequest;
import com.swifteats.swifteats.dto.auth.RegisterRequest;
import com.swifteats.swifteats.exception.ResourceAlreadyExistsException;
import com.swifteats.swifteats.model.Role;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional
    public JwtResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException(
                    "An account with email '" + request.getEmail() + "' already exists.");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .role(Role.CUSTOMER)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        JwtResponse response = buildAuthResponse(savedUser, jwtTokenProvider.generateToken(authentication));
        auditLogService.log("AUTH_REGISTER", savedUser.getEmail(), "User", String.valueOf(savedUser.getId()),
                java.util.Map.of("role", savedUser.getRole()));
        return response;
    }

    @Transactional
    public JwtResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found after authentication"));

        log.info("User logged in: {}", user.getEmail());
        JwtResponse response = buildAuthResponse(user, jwtTokenProvider.generateToken(authentication));
        auditLogService.log("AUTH_LOGIN", user.getEmail(), "User", String.valueOf(user.getId()),
                java.util.Map.of("role", user.getRole()));
        return response;
    }

    @Transactional
    public JwtResponse refresh(RefreshTokenRequest request) {
        User user = refreshTokenService.validateRefreshToken(request.getRefreshToken());
        String accessToken = jwtTokenProvider.generateToken(user.getEmail());
        JwtResponse response = buildAuthResponse(user, accessToken);
        auditLogService.log("AUTH_REFRESH", user.getEmail(), "User", String.valueOf(user.getId()), java.util.Map.of());
        return response;
    }

    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenService.revokeRefreshToken(request.getRefreshToken());
        auditLogService.log("AUTH_LOGOUT", currentActor(), "Session", "-", java.util.Map.of());
    }

    private JwtResponse buildAuthResponse(User user, String accessToken) {
        NotificationService.UnreadNotificationSnapshot unreadSnapshot;
        try {
            unreadSnapshot = notificationService.getUnreadSnapshotForUser(user);
        } catch (RuntimeException ex) {
            log.warn("Skipping unread notification payload during login for {}: {}", user.getEmail(), ex.getMessage());
            unreadSnapshot = new NotificationService.UnreadNotificationSnapshot(0, List.of());
        }
        String refreshToken = refreshTokenService.createRefreshToken(user);
        return JwtResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationSeconds())
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .unreadNotificationCount(unreadSnapshot.count())
                .unreadNotifications(unreadSnapshot.items())
                .build();
    }

    private String currentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : "anonymous";
    }
}
