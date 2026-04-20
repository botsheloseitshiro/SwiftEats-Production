package com.swifteats.swifteats.repository;

import com.swifteats.swifteats.model.Order;
import com.swifteats.swifteats.model.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByUserId(Long userId, Pageable pageable);
    Page<Order> findByUserIdAndArchivedByCustomerFalse(Long userId, Pageable pageable);

    List<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    List<Order> findByStatus(OrderStatus status);

    Page<Order> findByDriverId(Long driverId, Pageable pageable);

    Page<Order> findByRestaurantId(Long restaurantId, Pageable pageable);

    Page<Order> findByRestaurantIdAndStatus(Long restaurantId, OrderStatus status, Pageable pageable);

    boolean existsByIdAndUserIdAndRestaurantIdAndStatus(Long id, Long userId, Long restaurantId, OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.user.id = :userId " +
            "AND o.status NOT IN ('DELIVERED', 'CANCELLED')")
    long countActiveOrdersByUser(@Param("userId") Long userId);
}
