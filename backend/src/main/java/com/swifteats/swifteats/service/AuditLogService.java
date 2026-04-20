package com.swifteats.swifteats.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.StringJoiner;

@Slf4j
@Service
public class AuditLogService {

    public void log(String action, String actor, String targetType, String targetId, Map<String, ?> details) {
        StringJoiner joiner = new StringJoiner(", ");
        if (details != null) {
            details.forEach((key, value) -> joiner.add(key + "=" + value));
        }

        log.info(
                "AUDIT action={} actor={} targetType={} targetId={} details={}",
                action,
                actor != null ? actor : "anonymous",
                targetType != null ? targetType : "-",
                targetId != null ? targetId : "-",
                details == null || details.isEmpty() ? "-" : joiner
        );
    }
}
