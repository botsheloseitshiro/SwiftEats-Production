package com.swifteats.swifteats.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantDTO {
    private static final ZoneId RESTAURANT_ZONE = ZoneId.of("Africa/Johannesburg");

    /** Present in responses (from DB), absent in create requests */
    private Long id;

    @NotBlank(message = "Restaurant name is required")
    private String name;

    private String description;
    private String address;
    private String city;
    private Double latitude;
    private Double longitude;
    private Double deliveryRadiusKm;
    private Double distanceKm;
    private String locationLabel;
    private String displayName;
    private String category;
    private String imageUrl;

    @Builder.Default
    private Integer deliveryTimeMinutes = 30;

    @Builder.Default
    private BigDecimal deliveryFee = BigDecimal.valueOf(25.00);

    @Builder.Default
    private Double rating = 0.0;

    @Builder.Default
    private Long reviewCount = 0L;

    @Builder.Default
    private boolean active = true;
    @Builder.Default
    private boolean acceptingOrders = true;
    private LocalDateTime pauseOrdersUntil;
    private String holidayHours;

    private boolean openNow;
    private String mondayHours;
    private String tuesdayHours;
    private String wednesdayHours;
    private String thursdayHours;
    private String fridayHours;
    private String saturdayHours;
    private String sundayHours;
    private Long promotionCount;

    // --- Utility method: Entity → DTO ---
    public static RestaurantDTO fromEntity(com.swifteats.swifteats.model.Restaurant restaurant) {
        ZonedDateTime now = ZonedDateTime.now(RESTAURANT_ZONE);
        return RestaurantDTO.builder()
                .id(restaurant.getId())
                .name(restaurant.getName())
                .description(restaurant.getDescription())
                .address(restaurant.getAddress())
                .city(restaurant.getCity())
                .latitude(restaurant.getLatitude())
                .longitude(restaurant.getLongitude())
                .deliveryRadiusKm(restaurant.getDeliveryRadiusKm())
                .locationLabel(buildLocationLabel(restaurant.getAddress(), restaurant.getCity()))
                .displayName(buildDisplayName(restaurant.getName(), restaurant.getCity()))
                .category(restaurant.getCategory())
                .imageUrl(restaurant.getImageUrl())
                .deliveryTimeMinutes(restaurant.getDeliveryTimeMinutes())
                .deliveryFee(restaurant.getDeliveryFee())
                .rating(restaurant.getRating())
                .reviewCount(0L)
                .active(restaurant.isActive())
                .acceptingOrders(restaurant.isAcceptingOrders())
                .pauseOrdersUntil(restaurant.getPauseOrdersUntil())
                .holidayHours(restaurant.getHolidayHours())
                .openNow(restaurant.isActive() && restaurant.isWithinTradingHours(now.getDayOfWeek(), now.toLocalTime()))
                .mondayHours(restaurant.getMondayHours())
                .tuesdayHours(restaurant.getTuesdayHours())
                .wednesdayHours(restaurant.getWednesdayHours())
                .thursdayHours(restaurant.getThursdayHours())
                .fridayHours(restaurant.getFridayHours())
                .saturdayHours(restaurant.getSaturdayHours())
                .sundayHours(restaurant.getSundayHours())
                .promotionCount(0L)
                .build();
    }

    private static String buildLocationLabel(String address, String city) {
        if (address != null && !address.isBlank() && city != null && !city.isBlank()) {
            return address + ", " + city;
        }
        if (address != null && !address.isBlank()) {
            return address;
        }
        return city;
    }

    private static String buildDisplayName(String name, String city) {
        if (city == null || city.isBlank()) {
            return name;
        }
        return name + " - " + city;
    }
}
