package com.swifteats.swifteats.dto.favorite;

import com.swifteats.swifteats.dto.RestaurantDTO;
import com.swifteats.swifteats.model.FavoriteRestaurant;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FavoriteRestaurantDTO {
    private Long id;
    private RestaurantDTO restaurant;
    private LocalDateTime createdAt;

    public static FavoriteRestaurantDTO fromEntity(FavoriteRestaurant favoriteRestaurant) {
        return FavoriteRestaurantDTO.builder()
                .id(favoriteRestaurant.getId())
                .restaurant(RestaurantDTO.fromEntity(favoriteRestaurant.getRestaurant()))
                .createdAt(favoriteRestaurant.getCreatedAt())
                .build();
    }
}
