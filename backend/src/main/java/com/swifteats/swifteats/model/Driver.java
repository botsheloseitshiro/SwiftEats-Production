package com.swifteats.swifteats.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "drivers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "vehicle_type", length = 50)
    private String vehicleType;

    @Column(name = "license_plate", length = 20)
    private String licensePlate;

    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private boolean available = true;

    @Column(name = "total_deliveries")
    @Builder.Default
    private Integer totalDeliveries = 0;

    @OneToMany(mappedBy = "driver", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Order> orders = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
