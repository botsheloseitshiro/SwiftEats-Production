package com.swifteats.swifteats.dto.driver;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class DriverEarningsSummaryDTO {
    private long deliveredOrders;
    private BigDecimal earnings;
    private BigDecimal tipTotal;
}
