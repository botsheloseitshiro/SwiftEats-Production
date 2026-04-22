package com.swifteats.swifteats.dto.restaurant;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class RestaurantOwnerAnalyticsDTO {
    private BigDecimal dailyRevenue;
    private long orderVolume;
    private List<TopSellingItemDTO> topSellingItems;

    @Data
    @Builder
    public static class TopSellingItemDTO {
        private Long menuItemId;
        private String itemName;
        private Long quantitySold;
    }
}
