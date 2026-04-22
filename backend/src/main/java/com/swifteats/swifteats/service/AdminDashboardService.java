package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.admin.AdminDashboardDTO;
import com.swifteats.swifteats.model.Driver;
import com.swifteats.swifteats.model.Order;
import com.swifteats.swifteats.model.OrderStatus;
import com.swifteats.swifteats.model.Restaurant;
import com.swifteats.swifteats.repository.DriverRepository;
import com.swifteats.swifteats.repository.OrderRepository;
import com.swifteats.swifteats.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final OrderRepository orderRepository;
    private final RestaurantRepository restaurantRepository;
    private final DriverRepository driverRepository;

    @Transactional(readOnly = true)
    public AdminDashboardDTO getDashboard() {
        List<Order> orders = orderRepository.findAll();
        BigDecimal totalRevenue = orders.stream()
                .filter(order -> order.getStatus() == OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<AdminDashboardDTO.RankingItemDTO> topRestaurants = restaurantRepository.findByActiveTrue().stream()
                .map(restaurant -> AdminDashboardDTO.RankingItemDTO.builder()
                        .id(restaurant.getId())
                        .label(restaurant.getName())
                        .revenue(orders.stream()
                                .filter(order -> order.getRestaurant().getId().equals(restaurant.getId()))
                                .filter(order -> order.getStatus() == OrderStatus.DELIVERED)
                                .map(Order::getTotalAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add))
                        .count(orders.stream()
                                .filter(order -> order.getRestaurant().getId().equals(restaurant.getId()))
                                .count())
                        .build())
                .sorted(Comparator.comparing(AdminDashboardDTO.RankingItemDTO::getRevenue).reversed())
                .limit(5)
                .toList();

        List<AdminDashboardDTO.RankingItemDTO> driverPerformance = driverRepository.findAll().stream()
                .map(driver -> AdminDashboardDTO.RankingItemDTO.builder()
                        .id(driver.getId())
                        .label(driver.getUser().getFullName())
                        .count(driver.getTotalDeliveries().longValue())
                        .revenue(BigDecimal.valueOf(driver.getTotalDeliveries()).multiply(BigDecimal.valueOf(35)))
                        .build())
                .sorted(Comparator.comparing(AdminDashboardDTO.RankingItemDTO::getCount).reversed())
                .limit(5)
                .toList();

        List<String> alerts = buildAlerts(orders, restaurantRepository.findAll(), driverRepository.findAll());

        return AdminDashboardDTO.builder()
                .totalOrders(orders.size())
                .totalRevenue(totalRevenue)
                .activeDrivers(driverRepository.findAll().stream().filter(Driver::isActive).count())
                .activeRestaurants(restaurantRepository.findByActiveTrue().size())
                .topRestaurants(topRestaurants)
                .driverPerformance(driverPerformance)
                .alerts(alerts)
                .build();
    }

    private List<String> buildAlerts(List<Order> orders, List<Restaurant> restaurants, List<Driver> drivers) {
        long staleOrders = orders.stream()
                .filter(order -> order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.CANCELLED)
                .filter(order -> order.getCreatedAt() != null && order.getCreatedAt().isBefore(LocalDateTime.now().minusMinutes(45)))
                .count();
        long pausedRestaurants = restaurants.stream().filter(restaurant -> !restaurant.isAcceptingOrders()).count();
        long offlineDrivers = drivers.stream().filter(driver -> !driver.isOnline()).count();
        return List.of(
                staleOrders > 0 ? staleOrders + " orders have been open for more than 45 minutes." : null,
                pausedRestaurants > 0 ? pausedRestaurants + " restaurants are currently not accepting orders." : null,
                offlineDrivers > 0 ? offlineDrivers + " drivers are offline right now." : null
        ).stream().filter(java.util.Objects::nonNull).toList();
    }
}
