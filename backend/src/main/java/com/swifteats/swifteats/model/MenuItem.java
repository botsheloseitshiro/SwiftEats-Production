package com.swifteats.swifteats.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "menu_items", indexes = {
        @Index(name = "idx_menuitem_restaurant", columnList = "restaurant_id"),
        @Index(name = "idx_menuitem_available", columnList = "is_available"),
        @Index(name = "idx_menuitem_archived", columnList = "is_archived")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Dish name: e.g., "Quarter Chicken", "Veggie Burger", "Spicy Wings" */
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    /** Description: e.g., "Flame-grilled with mild PERi-PERi sauce + chips" */
    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /** Food category for grouping on the menu page: "Mains", "Sides", "Drinks", "Desserts" */
    @Column(name = "category", length = 100)
    private String category;

    /** Image URL for the dish thumbnail shown on menu item cards. */
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    /** Whether this item can currently be ordered. Out-of-stock items set this to false. */
    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private boolean available = true;

    @Column(name = "is_archived", nullable = false)
    @Builder.Default
    private boolean archived = false;

    @Column(name = "discount_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public boolean isOnPromotion() {
        return discountPercentage != null && discountPercentage.compareTo(BigDecimal.ZERO) > 0;
    }

    public BigDecimal getDiscountedPrice() {
        if (!isOnPromotion()) {
            return price;
        }

        BigDecimal multiplier = BigDecimal.ONE.subtract(
                discountPercentage.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
        );
        return price.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
    }
}
