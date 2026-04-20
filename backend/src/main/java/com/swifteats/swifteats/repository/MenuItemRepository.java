package com.swifteats.swifteats.repository;

import com.swifteats.swifteats.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByRestaurantId(Long restaurantId);

    List<MenuItem> findByRestaurantIdAndArchivedFalseAndAvailableTrue(Long restaurantId);

    List<MenuItem> findByRestaurantIdAndCategoryAndArchivedFalse(Long restaurantId, String category);

    Optional<MenuItem> findByIdAndArchivedFalse(Long id);

    Optional<MenuItem> findByRestaurantIdAndNameIgnoreCase(Long restaurantId, String name);
}
