package com.swifteats.swifteats.repository;

import com.swifteats.swifteats.model.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long>, JpaSpecificationExecutor<Restaurant> {

    List<Restaurant> findByActiveTrue();

    List<Restaurant> findByManagerId(Long managerId);

    List<Restaurant> findByCategoryAndActiveTrue(String category);

    List<Restaurant> findByNameContainingIgnoreCaseAndActiveTrue(String name);

    java.util.Optional<Restaurant> findByNameIgnoreCaseAndAddressIgnoreCase(String name, String address);

    /**
     * Haversine formula: returns active restaurants within radiusKm of the given coordinates,
     * ordered by distance ascending. Works with H2 (dev) and MySQL/PostgreSQL (prod).
     */
    @Query(value = """
        SELECT r.*, (
            6371 * ACOS(
                COS(RADIANS(:lat)) * COS(RADIANS(r.latitude)) *
                COS(RADIANS(r.longitude) - RADIANS(:lon)) +
                SIN(RADIANS(:lat)) * SIN(RADIANS(r.latitude))
            )
        ) AS distance_km
        FROM restaurants r
        WHERE r.is_active = true
          AND r.latitude IS NOT NULL
          AND r.longitude IS NOT NULL
          AND (
              6371 * ACOS(
                  COS(RADIANS(:lat)) * COS(RADIANS(r.latitude)) *
                  COS(RADIANS(r.longitude) - RADIANS(:lon)) +
                  SIN(RADIANS(:lat)) * SIN(RADIANS(r.latitude))
              )
          ) <= :radiusKm
        ORDER BY distance_km ASC
        """, nativeQuery = true)
    List<Restaurant> findNearbyRestaurants(@Param("lat") double lat,
                                           @Param("lon") double lon,
                                           @Param("radiusKm") double radiusKm);
}
