package com.swifteats.swifteats.repository;

import com.swifteats.swifteats.model.RefreshToken;
import com.swifteats.swifteats.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    void deleteByUser(User user);

    void deleteByExpiresAtBefore(LocalDateTime cutoff);
}
