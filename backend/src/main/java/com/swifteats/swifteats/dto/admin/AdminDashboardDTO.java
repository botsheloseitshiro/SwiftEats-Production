package com.swifteats.swifteats.dto.admin;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class AdminDashboardDTO {
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long activeDrivers;
    private long activeRestaurants;
    private List<RankingItemDTO> topRestaurants;
    private List<RankingItemDTO> driverPerformance;
    private List<String> alerts;

    @Data
    @Builder
    public static class RankingItemDTO {
        private Long id;
        private String label;
        private BigDecimal revenue;
        private Long count;
    }
}
