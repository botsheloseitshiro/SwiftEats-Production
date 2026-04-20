package com.swifteats.swifteats.dto.user;

import com.swifteats.swifteats.model.SavedCard;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedCardDTO {

    private Long id;
    private String cardType;
    private String cardHolderName;
    private String maskedCardNumber;
    private Integer expiryMonth;
    private Integer expiryYear;
    private boolean isDefault;

    public static SavedCardDTO fromEntity(SavedCard card) {
        return SavedCardDTO.builder()
                .id(card.getId())
                .cardType(card.getCardType().name())
                .cardHolderName(card.getCardHolderName())
                .maskedCardNumber("**** **** **** " + card.getLastFourDigits())
                .expiryMonth(card.getExpiryMonth())
                .expiryYear(card.getExpiryYear())
                .isDefault(card.isDefault())
                .build();
    }
}
