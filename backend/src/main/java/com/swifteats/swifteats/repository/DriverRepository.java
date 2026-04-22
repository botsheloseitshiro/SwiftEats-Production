package com.swifteats.swifteats.repository;

import com.swifteats.swifteats.model.Driver;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long>, JpaSpecificationExecutor<Driver> {

    Optional<Driver> findByUserId(Long userId);

    Optional<Driver> findByUserEmail(String email);

    List<Driver> findByAvailableTrue();

    List<Driver> findByAvailableTrueAndActiveTrueAndOnlineTrue();

    List<Driver> findByRestaurantIdAndAvailableTrueAndActiveTrueAndOnlineTrue(Long restaurantId);

    Page<Driver> findByActive(boolean active, Pageable pageable);

    Page<Driver> findByRestaurantId(Long restaurantId, Pageable pageable);

    long countByRestaurantId(Long restaurantId);

    boolean existsByUserEmail(String email);
}
