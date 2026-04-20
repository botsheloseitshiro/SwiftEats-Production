package com.swifteats.swifteats.service;

import com.swifteats.swifteats.repository.PasswordResetTokenRepository;
import com.swifteats.swifteats.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenMaintenanceService {

    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Scheduled(fixedDelayString = "${app.token-cleanup.fixed-delay-ms:3600000}")
    @Transactional
    public void cleanupExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        passwordResetTokenRepository.deleteByExpiresAtBefore(now);
        refreshTokenRepository.deleteByExpiresAtBefore(now);
        log.debug("Expired token cleanup completed at {}", now);
    }
}
