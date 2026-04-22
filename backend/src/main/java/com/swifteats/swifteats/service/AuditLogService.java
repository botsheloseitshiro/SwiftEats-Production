package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.admin.AuditLogDTO;
import com.swifteats.swifteats.dto.common.PaginatedResponse;
import com.swifteats.swifteats.model.AuditLogEntry;
import com.swifteats.swifteats.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.StringJoiner;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String action, String actor, String targetType, String targetId, Map<String, ?> details) {
        StringJoiner joiner = new StringJoiner(", ");
        if (details != null) {
            details.forEach((key, value) -> joiner.add(key + "=" + value));
        }

        String flattenedDetails = details == null || details.isEmpty() ? "-" : joiner.toString();

        auditLogRepository.save(AuditLogEntry.builder()
                .action(action)
                .actor(actor != null ? actor : "anonymous")
                .targetType(targetType)
                .targetId(targetId)
                .details(flattenedDetails)
                .build());

        log.info(
                "AUDIT action={} actor={} targetType={} targetId={} details={}",
                action,
                actor != null ? actor : "anonymous",
                targetType != null ? targetType : "-",
                targetId != null ? targetId : "-",
                flattenedDetails
        );
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<AuditLogDTO> getAuditLogs(String action, String actor, LocalDate from, LocalDate to, Pageable pageable) {
        Page<AuditLogEntry> page;
        if (from != null || to != null) {
            LocalDateTime start = from != null ? from.atStartOfDay() : LocalDate.of(2000, 1, 1).atStartOfDay();
            LocalDateTime end = to != null ? to.plusDays(1).atStartOfDay().minusNanos(1) : LocalDate.now().plusYears(1).atStartOfDay();
            page = auditLogRepository.findByCreatedAtBetween(start, end, pageable);
        } else {
            page = auditLogRepository.findByActionContainingIgnoreCaseAndActorContainingIgnoreCase(
                    action == null ? "" : action.trim(),
                    actor == null ? "" : actor.trim(),
                    pageable);
        }
        return PaginatedResponse.fromPage(page.map(AuditLogDTO::fromEntity));
    }
}
