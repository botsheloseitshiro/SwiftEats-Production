package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.RestaurantDTO;
import com.swifteats.swifteats.dto.common.PaginatedResponse;
import com.swifteats.swifteats.dto.restaurant.RestaurantOperationsRequest;
import com.swifteats.swifteats.dto.restaurant.RestaurantOwnerAnalyticsDTO;
import com.swifteats.swifteats.exception.ResourceNotFoundException;
import com.swifteats.swifteats.model.Order;
import com.swifteats.swifteats.model.OrderItem;
import com.swifteats.swifteats.model.OrderStatus;
import com.swifteats.swifteats.model.Restaurant;
import com.swifteats.swifteats.model.Role;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.OrderRepository;
import com.swifteats.swifteats.repository.RestaurantRepository;
import com.swifteats.swifteats.repository.ReviewRepository;
import com.swifteats.swifteats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestaurantService {
    private static final ZoneId RESTAURANT_ZONE = ZoneId.of("Africa/Johannesburg");

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final AuditLogService auditLogService;
    private final GeocodingService geocodingService;

    @Transactional(readOnly = true)
    public List<RestaurantDTO> getAllActiveRestaurants() {
        return restaurantRepository.findByActiveTrue()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<RestaurantDTO> browseActiveRestaurants(String search, String category, Pageable pageable) {
        Specification<Restaurant> specification = (root, query, cb) -> cb.isTrue(root.get("active"));

        if (search != null && !search.isBlank()) {
            String searchTerm = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("name")), searchTerm),
                            cb.like(cb.lower(root.get("city")), searchTerm),
                            cb.like(cb.lower(root.get("address")), searchTerm),
                            cb.like(cb.lower(root.get("category")), searchTerm),
                            cb.like(cb.lower(root.get("description")), searchTerm)
                    ));
        }

        if (category != null && !category.isBlank()) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("category"), category));
        }

        Page<RestaurantDTO> page = restaurantRepository.findAll(specification, pageable).map(this::toDto);
        return PaginatedResponse.fromPage(page);
    }

    @Transactional(readOnly = true)
    public RestaurantDTO getRestaurantById(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));
        return toDto(restaurant);
    }

    @Transactional(readOnly = true)
    public List<RestaurantDTO> getByCategory(String category) {
        return restaurantRepository.findByCategoryAndActiveTrue(category)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RestaurantDTO> searchByName(String name) {
        return restaurantRepository.findByNameContainingIgnoreCaseAndActiveTrue(name)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public RestaurantDTO createRestaurant(RestaurantDTO dto) {
        applyGeocoding(dto);
        Restaurant restaurant = Restaurant.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .address(dto.getAddress())
                .city(dto.getCity())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .deliveryRadiusKm(dto.getDeliveryRadiusKm() != null ? dto.getDeliveryRadiusKm() : 10.0)
                .category(dto.getCategory())
                .imageUrl(dto.getImageUrl())
                .deliveryTimeMinutes(dto.getDeliveryTimeMinutes() != null ? dto.getDeliveryTimeMinutes() : 30)
                .deliveryFee(dto.getDeliveryFee() != null ? dto.getDeliveryFee() : BigDecimal.valueOf(25.00))
                .rating(dto.getRating() != null ? dto.getRating() : 0.0)
                .active(dto.isActive())
                .acceptingOrders(true)
                .mondayHours(defaultHours(dto.getMondayHours(), "07:30-21:00"))
                .tuesdayHours(defaultHours(dto.getTuesdayHours(), "07:30-21:00"))
                .wednesdayHours(defaultHours(dto.getWednesdayHours(), "07:30-21:00"))
                .thursdayHours(defaultHours(dto.getThursdayHours(), "07:30-21:00"))
                .fridayHours(defaultHours(dto.getFridayHours(), "07:30-21:00"))
                .saturdayHours(defaultHours(dto.getSaturdayHours(), "07:30-20:00"))
                .sundayHours(defaultHours(dto.getSundayHours(), "07:30-20:00"))
                .build();

        Restaurant saved = restaurantRepository.save(restaurant);
        auditLogService.log("RESTAURANT_CREATED", currentActor(), "Restaurant", String.valueOf(saved.getId()),
                Map.of("name", saved.getName(), "active", saved.isActive()));
        return toDto(saved);
    }

    @Transactional
    public RestaurantDTO updateRestaurant(Long id, RestaurantDTO dto) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));
        validateRestaurantAccess(restaurant);

        restaurant.setName(dto.getName());
        restaurant.setDescription(dto.getDescription());
        restaurant.setAddress(dto.getAddress());
        if (dto.getCity() != null) restaurant.setCity(dto.getCity());
        if (dto.getLatitude() != null) restaurant.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) restaurant.setLongitude(dto.getLongitude());
        if (dto.getLatitude() == null || dto.getLongitude() == null) {
            GeocodingService.Coordinates coordinates = geocodingService.geocode(dto.getAddress(), dto.getCity());
            if (coordinates != null) {
                restaurant.setLatitude(coordinates.latitude());
                restaurant.setLongitude(coordinates.longitude());
            }
        }
        if (dto.getDeliveryRadiusKm() != null) restaurant.setDeliveryRadiusKm(dto.getDeliveryRadiusKm());
        restaurant.setCategory(dto.getCategory());
        restaurant.setImageUrl(dto.getImageUrl());
        if (dto.getDeliveryTimeMinutes() != null) {
            restaurant.setDeliveryTimeMinutes(dto.getDeliveryTimeMinutes());
        }
        if (dto.getDeliveryFee() != null) {
            restaurant.setDeliveryFee(dto.getDeliveryFee());
        }
        restaurant.setActive(dto.isActive());
        restaurant.setMondayHours(defaultHours(dto.getMondayHours(), restaurant.getMondayHours()));
        restaurant.setTuesdayHours(defaultHours(dto.getTuesdayHours(), restaurant.getTuesdayHours()));
        restaurant.setWednesdayHours(defaultHours(dto.getWednesdayHours(), restaurant.getWednesdayHours()));
        restaurant.setThursdayHours(defaultHours(dto.getThursdayHours(), restaurant.getThursdayHours()));
        restaurant.setFridayHours(defaultHours(dto.getFridayHours(), restaurant.getFridayHours()));
        restaurant.setSaturdayHours(defaultHours(dto.getSaturdayHours(), restaurant.getSaturdayHours()));
        restaurant.setSundayHours(defaultHours(dto.getSundayHours(), restaurant.getSundayHours()));

        Restaurant updated = restaurantRepository.save(restaurant);
        auditLogService.log("RESTAURANT_UPDATED", currentActor(), "Restaurant", String.valueOf(updated.getId()),
                Map.of("name", updated.getName(), "active", updated.isActive()));
        return toDto(updated);
    }

    @Transactional
    public void deleteRestaurant(Long id) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));
        restaurant.setActive(false);
        restaurantRepository.save(restaurant);
        auditLogService.log("RESTAURANT_DEACTIVATED", currentActor(), "Restaurant", String.valueOf(restaurant.getId()),
                Map.of("name", restaurant.getName()));
    }

    @Transactional(readOnly = true)
    public List<RestaurantDTO> getAllRestaurantsIncludingInactive() {
        return restaurantRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<RestaurantDTO> getAdminRestaurants(String search, Boolean active, Pageable pageable) {
        Specification<Restaurant> specification = (root, query, cb) -> cb.conjunction();

        if (search != null && !search.isBlank()) {
            String searchTerm = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("name")), searchTerm),
                            cb.like(cb.lower(root.get("category")), searchTerm),
                            cb.like(cb.lower(root.get("city")), searchTerm),
                            cb.like(cb.lower(root.get("address")), searchTerm)
                    ));
        }

        if (active != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("active"), active));
        }

        Page<RestaurantDTO> page = restaurantRepository.findAll(specification, pageable).map(this::toDto);
        return PaginatedResponse.fromPage(page);
    }

    @Transactional
    public RestaurantDTO updateRestaurantActive(Long id, boolean active) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));
        validateRestaurantAccess(restaurant);

        restaurant.setActive(active);
        Restaurant updated = restaurantRepository.save(restaurant);
        auditLogService.log("RESTAURANT_STATUS_CHANGED", currentActor(), "Restaurant", String.valueOf(updated.getId()),
                Map.of("name", updated.getName(), "active", updated.isActive()));
        return toDto(updated);
    }

    @Transactional(readOnly = true)
    public List<RestaurantDTO> getNearbyRestaurants(double lat, double lon, double radiusKm, Double minRating, Integer maxDeliveryTimeMinutes) {
        return restaurantRepository.findByActiveTrue().stream()
                .filter(restaurant -> restaurant.getLatitude() != null && restaurant.getLongitude() != null)
                .map(restaurant -> toDtoWithDistance(restaurant, lat, lon))
                .filter(dto -> dto.getDistanceKm() != null && dto.getDistanceKm() <= radiusKm)
                .filter(dto -> dto.getDeliveryRadiusKm() == null || dto.getDistanceKm() <= dto.getDeliveryRadiusKm())
                .filter(dto -> minRating == null || (dto.getRating() != null && dto.getRating() >= minRating))
                .filter(dto -> maxDeliveryTimeMinutes == null || (dto.getDeliveryTimeMinutes() != null && dto.getDeliveryTimeMinutes() <= maxDeliveryTimeMinutes))
                .sorted(Comparator.comparing(RestaurantDTO::getDistanceKm))
                .toList();
    }

    @Transactional
    public RestaurantDTO updateRestaurantOperations(Long id, RestaurantOperationsRequest request) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + id));
        validateRestaurantAccess(restaurant);
        if (request.getAcceptingOrders() != null) {
            restaurant.setAcceptingOrders(request.getAcceptingOrders());
        }
        if (request.getPauseOrdersUntil() != null) {
            restaurant.setPauseOrdersUntil(request.getPauseOrdersUntil());
        }
        if (request.getHolidayHours() != null) {
            restaurant.setHolidayHours(request.getHolidayHours());
        }
        Restaurant updated = restaurantRepository.save(restaurant);
        auditLogService.log("RESTAURANT_OPERATIONS_UPDATED", currentActor(), "Restaurant", String.valueOf(updated.getId()),
                Map.of("acceptingOrders", updated.isAcceptingOrders()));
        return toDto(updated);
    }

    @Transactional(readOnly = true)
    public RestaurantOwnerAnalyticsDTO getRestaurantAnalytics(String managerEmail, Long restaurantId) {
        Restaurant restaurant = getManagedRestaurant(managerEmail, restaurantId);
        LocalDate today = LocalDate.now(RESTAURANT_ZONE);
        List<Order> todayOrders = orderRepository.findByRestaurantIdAndCreatedAtBetween(
                restaurant.getId(),
                today.atStartOfDay(),
                today.plusDays(1).atStartOfDay().minusNanos(1));

        BigDecimal dailyRevenue = todayOrders.stream()
                .filter(order -> order.getStatus() == OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<RestaurantOwnerAnalyticsDTO.TopSellingItemDTO> topSellingItems = todayOrders.stream()
                .flatMap(order -> order.getOrderItems().stream())
                .collect(Collectors.groupingBy(OrderItem::getItemName, Collectors.summingLong(OrderItem::getQuantity)))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(entry -> RestaurantOwnerAnalyticsDTO.TopSellingItemDTO.builder()
                        .menuItemId(null)
                        .itemName(entry.getKey())
                        .quantitySold(entry.getValue())
                        .build())
                .toList();

        return RestaurantOwnerAnalyticsDTO.builder()
                .dailyRevenue(dailyRevenue)
                .orderVolume(todayOrders.size())
                .topSellingItems(topSellingItems)
                .build();
    }

    @Transactional
    public RestaurantDTO assignRestaurantManager(Long restaurantId, Long adminUserId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));
        User manager = userRepository.findById(adminUserId)
                .filter(user -> user.getRole() == Role.RESTAURANT_ADMIN || user.getRole() == Role.ADMIN)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant admin not found with id: " + adminUserId));
        restaurant.setManager(manager);
        Restaurant updated = restaurantRepository.save(restaurant);
        auditLogService.log("RESTAURANT_MANAGER_ASSIGNED", currentActor(), "Restaurant", String.valueOf(restaurantId),
                Map.of("managerUserId", adminUserId));
        return toDto(updated);
    }

    /** Haversine great-circle distance in kilometres */
    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private void validateRestaurantAccess(Restaurant restaurant) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(g -> g.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) {
            return;
        }

        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        if (user.getRole() == Role.RESTAURANT_ADMIN) {
            boolean manages = user.getManagedRestaurants() != null
                    && user.getManagedRestaurants().stream().anyMatch(r -> r.getId() != null && r.getId().equals(restaurant.getId()));
            if (!manages) {
                throw new AccessDeniedException("You can only manage your own restaurant");
            }
        } else {
            throw new AccessDeniedException("Only admins and restaurant owners can perform this action");
        }
    }

    private RestaurantDTO toDto(Restaurant restaurant) {
        RestaurantDTO dto = RestaurantDTO.fromEntity(restaurant);
        dto.setReviewCount(reviewRepository.countRestaurantReviews(restaurant.getId()));
        dto.setPromotionCount(restaurant.getMenuItems().stream()
                .filter(item -> !item.isArchived() && item.isAvailable() && item.isOnPromotion())
                .count());
        ZonedDateTime now = ZonedDateTime.now(RESTAURANT_ZONE);
        dto.setOpenNow(restaurant.isActive() && restaurant.isWithinTradingHours(now.getDayOfWeek(), now.toLocalTime()));
        return dto;
    }

    private RestaurantDTO toDtoWithDistance(Restaurant restaurant, double lat, double lon) {
        RestaurantDTO dto = toDto(restaurant);
        if (restaurant.getLatitude() != null && restaurant.getLongitude() != null) {
            double dist = haversineKm(lat, lon, restaurant.getLatitude(), restaurant.getLongitude());
            dto.setDistanceKm(Math.round(dist * 10.0) / 10.0);
        }
        return dto;
    }

    private String defaultHours(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private Restaurant getManagedRestaurant(String managerEmail, Long restaurantId) {
        User user = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + managerEmail));
        List<Restaurant> managedRestaurants = restaurantRepository.findByManagerId(user.getId());
        if (managedRestaurants.isEmpty()) {
            throw new AccessDeniedException("No managed restaurants found for this account");
        }
        if (restaurantId != null) {
            return managedRestaurants.stream()
                    .filter(restaurant -> Objects.equals(restaurant.getId(), restaurantId))
                    .findFirst()
                    .orElseThrow(() -> new AccessDeniedException("Restaurant is not managed by this account"));
        }
        return managedRestaurants.get(0);
    }

    private void applyGeocoding(RestaurantDTO dto) {
        if (dto.getLatitude() != null && dto.getLongitude() != null) {
            return;
        }
        GeocodingService.Coordinates coordinates = geocodingService.geocode(dto.getAddress(), dto.getCity());
        if (coordinates != null) {
            dto.setLatitude(coordinates.latitude());
            dto.setLongitude(coordinates.longitude());
        }
    }

    private String currentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : "system";
    }
}
