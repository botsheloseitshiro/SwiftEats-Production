package com.swifteats.swifteats.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "restaurants", indexes = {
        // Index for faster text search by name or category
        @Index(name = "idx_restaurant_category", columnList = "category"),
        @Index(name = "idx_restaurant_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "address", length = 300)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "delivery_radius_km")
    @Builder.Default
    private Double deliveryRadiusKm = 10.0;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "delivery_time_minutes")
    @Builder.Default
    private Integer deliveryTimeMinutes = 30;

    @Column(name = "delivery_fee", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal deliveryFee = BigDecimal.valueOf(25.00);

    @Column(name = "rating")
    @Builder.Default
    private Double rating = 0.0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "monday_hours", length = 50)
    @Builder.Default
    private String mondayHours = "07:30-21:00";

    @Column(name = "tuesday_hours", length = 50)
    @Builder.Default
    private String tuesdayHours = "07:30-21:00";

    @Column(name = "wednesday_hours", length = 50)
    @Builder.Default
    private String wednesdayHours = "07:30-21:00";

    @Column(name = "thursday_hours", length = 50)
    @Builder.Default
    private String thursdayHours = "07:30-21:00";

    @Column(name = "friday_hours", length = 50)
    @Builder.Default
    private String fridayHours = "07:30-21:00";

    @Column(name = "saturday_hours", length = 50)
    @Builder.Default
    private String saturdayHours = "07:30-20:00";

    @Column(name = "sunday_hours", length = 50)
    @Builder.Default
    private String sundayHours = "07:30-20:00";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = true)
    private User manager;

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<MenuItem> menuItems = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public String getHoursForDay(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> mondayHours;
            case TUESDAY -> tuesdayHours;
            case WEDNESDAY -> wednesdayHours;
            case THURSDAY -> thursdayHours;
            case FRIDAY -> fridayHours;
            case SATURDAY -> saturdayHours;
            case SUNDAY -> sundayHours;
        };
    }

    public boolean isOpenAt(DayOfWeek dayOfWeek, LocalTime localTime) {
        String hours = getHoursForDay(dayOfWeek);
        if (hours == null || hours.isBlank() || "CLOSED".equalsIgnoreCase(hours.trim())) {
            return false;
        }

        String[] parts = hours.split("-");
        if (parts.length != 2) {
            return false;
        }

        LocalTime open = LocalTime.parse(parts[0].trim());
        LocalTime close = LocalTime.parse(parts[1].trim());
        return !localTime.isBefore(open) && !localTime.isAfter(close);
    }
}
