package com.swifteats.swifteats.repository;

import com.swifteats.swifteats.model.FavoriteRestaurant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRestaurantRepository extends JpaRepository<FavoriteRestaurant, Long> {

    List<FavoriteRestaurant> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<FavoriteRestaurant> findByUserIdAndRestaurantId(Long userId, Long restaurantId);

    boolean existsByUserIdAndRestaurantId(Long userId, Long restaurantId);
}
