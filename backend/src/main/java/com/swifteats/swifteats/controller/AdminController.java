package com.swifteats.swifteats.controller;

import com.swifteats.swifteats.dto.admin.AdminDashboardDTO;
import com.swifteats.swifteats.dto.admin.AuditLogDTO;
import com.swifteats.swifteats.dto.common.PaginatedResponse;
import com.swifteats.swifteats.dto.user.AdminUserSummaryDTO;
import com.swifteats.swifteats.service.AdminDashboardService;
import com.swifteats.swifteats.service.AuditLogService;
import com.swifteats.swifteats.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping({"/api/admin", "/api/v1/admin"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final AuditLogService auditLogService;
    private final AdminDashboardService adminDashboardService;

    @GetMapping("/users")
    public ResponseEntity<PaginatedResponse<AdminUserSummaryDTO>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean active,
            @ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(userService.getUsersForAdmin(search, role, active, pageable));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<PaginatedResponse<AuditLogDTO>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(auditLogService.getAuditLogs(action, actor, from, to, pageable));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardDTO> getDashboard() {
        return ResponseEntity.ok(adminDashboardService.getDashboard());
    }
}
