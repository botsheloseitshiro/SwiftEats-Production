package com.swifteats.swifteats.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemDTO {

    /** Null on create, populated on GET responses */
    private Long id;

    /** The restaurant this item belongs to — required on create */
    private Long restaurantId;

    @NotBlank(message = "Item name is required")
    private String name;

    private String description;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    private String category;
    private String imageUrl;
    private Double rating;
    private Long reviewCount;
    private boolean archived;
    private BigDecimal discountPercentage;
    private BigDecimal discountedPrice;
    private boolean onPromotion;

    @Builder.Default
    private boolean available = true;

    public static MenuItemDTO fromEntity(com.swifteats.swifteats.model.MenuItem item) {
        return MenuItemDTO.builder()
                .id(item.getId())
                .restaurantId(item.getRestaurant().getId())
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .category(item.getCategory())
                .imageUrl(item.getImageUrl())
                .rating(0.0)
                .reviewCount(0L)
                .archived(item.isArchived())
                .available(item.isAvailable())
                .discountPercentage(item.getDiscountPercentage())
                .discountedPrice(item.getDiscountedPrice())
                .onPromotion(item.isOnPromotion())
                .build();
    }
}
