package com.swifteats.swifteats.dto.order;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class TipSuggestionDTO {
    private BigDecimal suggestedTip;
    private List<BigDecimal> options;
    private String reason;
}
