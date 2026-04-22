package com.swifteats.swifteats.repository;

import com.swifteats.swifteats.model.AuditLogEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface AuditLogRepository extends JpaRepository<AuditLogEntry, Long> {

    Page<AuditLogEntry> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);

    Page<AuditLogEntry> findByActionContainingIgnoreCaseAndActorContainingIgnoreCase(
            String action, String actor, Pageable pageable);
}
