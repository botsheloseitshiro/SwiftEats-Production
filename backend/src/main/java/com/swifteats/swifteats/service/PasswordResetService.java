package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.auth.ForgotPasswordRequest;
import com.swifteats.swifteats.dto.auth.MessageResponse;
import com.swifteats.swifteats.dto.auth.ResetPasswordRequest;
import com.swifteats.swifteats.exception.ResourceNotFoundException;
import com.swifteats.swifteats.model.PasswordResetToken;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.PasswordResetTokenRepository;
import com.swifteats.swifteats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetNotificationService passwordResetNotificationService;

    @Value("${app.reset-password.expiration-ms}")
    private long resetPasswordExpirationMs;

    @Value("${app.frontend.reset-password-url}")
    private String resetPasswordUrl;

    @Value("${app.reset-password.expose-link:false}")
    private boolean exposeResetLink;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Transactional
    public MessageResponse requestPasswordReset(ForgotPasswordRequest request) {
        passwordResetTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());

        String normalizedEmail = User.normalizeEmail(request.getEmail());
        Optional<User> userOptional = userRepository.findByEmail(normalizedEmail);
        if (userOptional.isEmpty()) {
            log.info("Password reset requested for unknown email {}", normalizedEmail);
            throw new ResourceNotFoundException("No account exists for email '" + normalizedEmail + "'.");
        }

        User user = userOptional.get();
        if (!user.isActive()) {
            log.info("Password reset requested for inactive account {}", normalizedEmail);
            throw new IllegalStateException("This account is inactive. Please contact support.");
        }

        passwordResetTokenRepository.deleteByUser(user);

        String rawToken = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");

        PasswordResetToken passwordResetToken = PasswordResetToken.builder()
                .tokenHash(hashToken(rawToken))
                .user(user)
                .expiresAt(LocalDateTime.now().plusNanos(resetPasswordExpirationMs * 1_000_000))
                .build();

        passwordResetTokenRepository.save(passwordResetToken);

        String resetLink = UriComponentsBuilder.fromUriString(resetPasswordUrl)
                .queryParam("token", rawToken)
                .build()
                .toUriString();

        passwordResetNotificationService.sendPasswordResetEmail(user, resetLink);
        log.info("Password reset token issued for {}", user.getEmail());

        return new MessageResponse("Password reset link generated successfully.", shouldExposeResetLink() ? resetLink : null);
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(hashToken(request.getToken()))
                .orElseThrow(() -> new IllegalArgumentException("This password reset link is invalid or has expired."));

        if (token.getUsedAt() != null) {
            throw new IllegalArgumentException("This password reset link has already been used.");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            passwordResetTokenRepository.delete(token);
            throw new IllegalArgumentException("This password reset link is invalid or has expired.");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        passwordResetTokenRepository.deleteByUser(user);

        log.info("Password reset completed for {}", user.getEmail());
        return new MessageResponse("Your password has been reset successfully. You can now sign in.");
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm is not available", ex);
        }
    }

    private boolean shouldExposeResetLink() {
        return exposeResetLink || mailHost == null || mailHost.isBlank();
    }
}
