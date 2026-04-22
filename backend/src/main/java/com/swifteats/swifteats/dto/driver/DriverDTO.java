package com.swifteats.swifteats.dto.driver;

import com.swifteats.swifteats.model.Driver;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DriverDTO {
    private Long id;
    private Long userId;
    private Long restaurantId;
    private String restaurantName;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private String vehicleType;
    private String licensePlate;
    private boolean active;
    private boolean available;
    private boolean online;
    private Integer totalDeliveries;
    private Double latitude;
    private Double longitude;
    private LocalDateTime lastLocationUpdatedAt;

    public static DriverDTO fromEntity(Driver driver) {
        return DriverDTO.builder()
                .id(driver.getId())
                .userId(driver.getUser().getId())
                .restaurantId(driver.getRestaurant() != null ? driver.getRestaurant().getId() : null)
                .restaurantName(driver.getRestaurant() != null ? driver.getRestaurant().getName() : null)
                .fullName(driver.getUser().getFullName())
                .email(driver.getUser().getEmail())
                .phoneNumber(driver.getUser().getPhoneNumber())
                .address(driver.getUser().getAddress())
                .vehicleType(driver.getVehicleType())
                .licensePlate(driver.getLicensePlate())
                .active(driver.isActive())
                .available(driver.isAvailable())
                .online(driver.isOnline())
                .totalDeliveries(driver.getTotalDeliveries())
                .latitude(driver.getLatitude())
                .longitude(driver.getLongitude())
                .lastLocationUpdatedAt(driver.getLastLocationUpdatedAt())
                .build();
    }
}
