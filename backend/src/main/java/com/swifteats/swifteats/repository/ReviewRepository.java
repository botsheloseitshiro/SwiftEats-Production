package com.swifteats.swifteats.repository;

import com.swifteats.swifteats.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByRestaurantIdAndMenuItemIsNullOrderByCreatedAtDesc(Long restaurantId);

    List<Review> findByMenuItemIdOrderByCreatedAtDesc(Long menuItemId);

    Optional<Review> findByUserIdAndOrderIdAndRestaurantIdAndMenuItemIsNull(Long userId, Long orderId, Long restaurantId);

    Optional<Review> findByUserIdAndOrderIdAndMenuItemId(Long userId, Long orderId, Long menuItemId);

    List<Review> findByUserIdAndOrderId(Long userId, Long orderId);

    @Query("select avg(r.rating) from Review r where r.restaurant.id = :restaurantId and r.menuItem is null")
    Double findAverageRestaurantRating(Long restaurantId);

    @Query("select count(r) from Review r where r.restaurant.id = :restaurantId and r.menuItem is null")
    long countRestaurantReviews(Long restaurantId);

    @Query("select avg(r.rating) from Review r where r.menuItem.id = :menuItemId")
    Double findAverageMenuItemRating(Long menuItemId);

    @Query("select count(r) from Review r where r.menuItem.id = :menuItemId")
    long countMenuItemReviews(Long menuItemId);
}
