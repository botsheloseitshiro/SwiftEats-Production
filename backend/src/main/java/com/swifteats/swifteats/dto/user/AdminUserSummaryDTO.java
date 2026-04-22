package com.swifteats.swifteats.dto.user;

import com.swifteats.swifteats.model.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminUserSummaryDTO {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private String role;
    private boolean active;

    public static AdminUserSummaryDTO fromEntity(User user) {
        return AdminUserSummaryDTO.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .role(user.getRole().name())
                .active(user.isActive())
                .build();
    }
}
