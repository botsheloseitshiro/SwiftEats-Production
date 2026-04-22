package com.swifteats.swifteats.dto.admin;

import com.swifteats.swifteats.model.AuditLogEntry;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogDTO {
    private Long id;
    private String action;
    private String actor;
    private String targetType;
    private String targetId;
    private String details;
    private LocalDateTime createdAt;

    public static AuditLogDTO fromEntity(AuditLogEntry entry) {
        return AuditLogDTO.builder()
                .id(entry.getId())
                .action(entry.getAction())
                .actor(entry.getActor())
                .targetType(entry.getTargetType())
                .targetId(entry.getTargetId())
                .details(entry.getDetails())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
