package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.common.PaginatedResponse;
import com.swifteats.swifteats.dto.driver.AdminCreateDriverRequest;
import com.swifteats.swifteats.dto.driver.DriverDTO;
import com.swifteats.swifteats.dto.driver.DriverEarningsSummaryDTO;
import com.swifteats.swifteats.dto.driver.DriverLocationUpdateRequest;
import com.swifteats.swifteats.dto.driver.DriverShiftRequest;
import com.swifteats.swifteats.dto.driver.UpdateDriverRequest;
import com.swifteats.swifteats.exception.ResourceAlreadyExistsException;
import com.swifteats.swifteats.exception.ResourceNotFoundException;
import com.swifteats.swifteats.model.Driver;
import com.swifteats.swifteats.model.DriverAssignmentStatus;
import com.swifteats.swifteats.model.NotificationType;
import com.swifteats.swifteats.model.Order;
import com.swifteats.swifteats.model.OrderStatus;
import com.swifteats.swifteats.model.Restaurant;
import com.swifteats.swifteats.model.Role;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.DriverRepository;
import com.swifteats.swifteats.repository.OrderRepository;
import com.swifteats.swifteats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DriverManagementService {

    private static final BigDecimal BASE_DELIVERY_EARNING = BigDecimal.valueOf(35);

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final OrderService orderService;

    @Transactional
    public DriverDTO createDriver(AdminCreateDriverRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("An account with email '" + request.getEmail() + "' already exists.");
        }

        User user = userRepository.save(User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .role(Role.DRIVER)
                .active(true)
                .build());

        Driver driver = driverRepository.save(Driver.builder()
                .user(user)
                .vehicleType(request.getVehicleType())
                .licensePlate(request.getLicensePlate())
                .active(true)
                .available(false)
                .online(false)
                .totalDeliveries(0)
                .build());
        auditLogService.log("DRIVER_CREATED", "admin", "Driver", String.valueOf(driver.getId()), Map.of("email", request.getEmail()));
        return DriverDTO.fromEntity(driver);
    }

    @Transactional
    public DriverDTO createDriverForRestaurant(String managerEmail, Long restaurantId, AdminCreateDriverRequest request) {
        Restaurant restaurant = getManagedRestaurant(managerEmail, restaurantId);
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("An account with email '" + request.getEmail() + "' already exists.");
        }

        User user = userRepository.save(User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .role(Role.DRIVER)
                .active(true)
                .build());

        Driver driver = driverRepository.save(Driver.builder()
                .user(user)
                .restaurant(restaurant)
                .vehicleType(request.getVehicleType())
                .licensePlate(request.getLicensePlate())
                .active(true)
                .available(false)
                .online(false)
                .totalDeliveries(0)
                .build());

        notificationService.createNotification(user, NotificationType.DRIVER_ASSIGNMENT,
                "Driver account created", "You have been added to " + restaurant.getName() + " as a restaurant driver.",
                "Restaurant", String.valueOf(restaurant.getId()));
        auditLogService.log("RESTAURANT_DRIVER_CREATED", managerEmail, "Driver", String.valueOf(driver.getId()),
                Map.of("restaurantId", restaurant.getId(), "email", request.getEmail()));
        return DriverDTO.fromEntity(driver);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<DriverDTO> getDrivers(String search, Boolean active, Pageable pageable) {
        Specification<Driver> specification = buildDriverSearchSpecification(search, active);
        return PaginatedResponse.fromPage(driverRepository.findAll(specification, pageable).map(DriverDTO::fromEntity));
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<DriverDTO> getDriversForRestaurant(String managerEmail, Long restaurantId, String search, Boolean active, Pageable pageable) {
        Restaurant restaurant = getManagedRestaurant(managerEmail, restaurantId);
        Specification<Driver> specification = (root, query, cb) -> cb.equal(root.get("restaurant").get("id"), restaurant.getId());
        specification = specification.and(buildDriverSearchSpecification(search, active));
        return PaginatedResponse.fromPage(driverRepository.findAll(specification, pageable).map(DriverDTO::fromEntity));
    }

    @Transactional
    public DriverDTO setDriverActive(Long driverId, boolean active) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + driverId));
        return updateDriverActiveState(driver, active, "admin", Map.of("active", active));
    }

    @Transactional
    public DriverDTO setDriverActiveForRestaurant(String managerEmail, Long restaurantId, Long driverId, boolean active) {
        Driver driver = getRestaurantDriver(managerEmail, restaurantId, driverId);
        return updateDriverActiveState(driver, active, managerEmail, Map.of("active", active, "restaurantId", driver.getRestaurant().getId()));
    }

    @Transactional
    public DriverDTO setDriverAvailabilityForRestaurant(String managerEmail, Long restaurantId, Long driverId, boolean available) {
        Driver driver = getRestaurantDriver(managerEmail, restaurantId, driverId);
        driver.setAvailable(driver.isActive() && available);
        Driver saved = driverRepository.save(driver);
        if (saved.isOnline() && saved.isAvailable() && saved.getRestaurant() != null) {
            orderService.autoAssignPendingOrdersForRestaurant(saved.getRestaurant().getId());
        }
        auditLogService.log("DRIVER_AVAILABILITY_CHANGED", managerEmail, "Driver", String.valueOf(driverId),
                Map.of("available", saved.isAvailable(), "restaurantId", driver.getRestaurant().getId()));
        return DriverDTO.fromEntity(saved);
    }

    @Transactional
    public DriverDTO updateDriverForRestaurant(String managerEmail, Long restaurantId, Long driverId, UpdateDriverRequest request) {
        Driver driver = getRestaurantDriver(managerEmail, restaurantId, driverId);
        User driverUser = driver.getUser();

        userRepository.findByEmail(request.getEmail())
                .filter(existing -> !existing.getId().equals(driverUser.getId()))
                .ifPresent(existing -> {
                    throw new ResourceAlreadyExistsException("An account with email '" + request.getEmail() + "' already exists.");
                });

        driverUser.setFullName(request.getFullName());
        driverUser.setEmail(request.getEmail());
        driverUser.setPhoneNumber(request.getPhoneNumber());
        driverUser.setAddress(request.getAddress());
        driver.setVehicleType(request.getVehicleType());
        driver.setLicensePlate(request.getLicensePlate());

        userRepository.save(driverUser);
        Driver saved = driverRepository.save(driver);
        auditLogService.log("RESTAURANT_DRIVER_UPDATED", managerEmail, "Driver", String.valueOf(driverId),
                Map.of("restaurantId", driver.getRestaurant().getId(), "email", request.getEmail()));
        return DriverDTO.fromEntity(saved);
    }

    @Transactional
    public DriverDTO updateAvailability(Long driverId, boolean available) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + driverId));
        driver.setAvailable(driver.isActive() && available);
        Driver saved = driverRepository.save(driver);
        if (saved.isOnline() && saved.isAvailable() && saved.getRestaurant() != null) {
            orderService.autoAssignPendingOrdersForRestaurant(saved.getRestaurant().getId());
        }
        return DriverDTO.fromEntity(saved);
    }

    @Transactional
    public DriverDTO updateCurrentDriverShift(String email, DriverShiftRequest request) {
        Driver driver = getDriverByEmail(email);
        boolean online = Boolean.TRUE.equals(request.getOnline()) && driver.isActive();
        driver.setOnline(online);
        if (online) {
            driver.setCurrentShiftStartedAt(LocalDateTime.now());
        } else {
            driver.setLastShiftEndedAt(LocalDateTime.now());
        }
        Driver saved = driverRepository.save(driver);
        if (saved.isOnline() && saved.isAvailable() && saved.getRestaurant() != null) {
            orderService.autoAssignPendingOrdersForRestaurant(saved.getRestaurant().getId());
        }
        return DriverDTO.fromEntity(saved);
    }

    @Transactional
    public DriverDTO updateCurrentDriverAvailability(String email, boolean available) {
        Driver driver = getDriverByEmail(email);
        driver.setAvailable(driver.isActive() && available);
        Driver saved = driverRepository.save(driver);
        if (saved.isOnline() && saved.isAvailable() && saved.getRestaurant() != null) {
            orderService.autoAssignPendingOrdersForRestaurant(saved.getRestaurant().getId());
        }
        return DriverDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public DriverDTO getCurrentDriver(String email) {
        return DriverDTO.fromEntity(getDriverByEmail(email));
    }

    @Transactional
    public DriverDTO updateCurrentDriverLocation(String email, DriverLocationUpdateRequest request) {
        Driver driver = getDriverByEmail(email);
        driver.setLatitude(request.getLatitude());
        driver.setLongitude(request.getLongitude());
        driver.setLastLocationUpdatedAt(LocalDateTime.now());
        return DriverDTO.fromEntity(driverRepository.save(driver));
    }

    @Transactional(readOnly = true)
    public DriverEarningsSummaryDTO getEarningsSummary(String email) {
        Driver driver = getDriverByEmail(email);
        List<Order> deliveredOrders = orderRepository.findByDriverId(driver.getId(), Pageable.unpaged()).getContent().stream()
                .filter(order -> order.getStatus() == OrderStatus.DELIVERED)
                .toList();
        BigDecimal tipTotal = deliveredOrders.stream()
                .map(Order::getTipAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal earnings = BASE_DELIVERY_EARNING.multiply(BigDecimal.valueOf(deliveredOrders.size())).add(tipTotal)
                .setScale(2, RoundingMode.HALF_UP);
        return DriverEarningsSummaryDTO.builder()
                .deliveredOrders(deliveredOrders.size())
                .tipTotal(tipTotal.setScale(2, RoundingMode.HALF_UP))
                .earnings(earnings)
                .build();
    }

    @Transactional
    public DriverDTO assignOrderToDriver(Long orderId, Long driverId, String actor) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + driverId));
        return assignOrder(order, driver, actor, "New delivery request",
                "Order #" + order.getId() + " is ready for driver response.");
    }

    @Transactional
    public DriverDTO assignOrderToRestaurantDriver(Long orderId, Long driverId, String managerEmail, Long restaurantId) {
        Restaurant restaurant = getManagedRestaurant(managerEmail, restaurantId);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        if (!order.getRestaurant().getId().equals(restaurant.getId())) {
            throw new AccessDeniedException("You can only assign drivers for orders from your restaurant.");
        }

        Driver driver = getRestaurantDriver(managerEmail, restaurantId, driverId);
        return assignOrder(order, driver, managerEmail, "New delivery request",
                "Order #" + order.getId() + " from " + restaurant.getName() + " is ready for your response.");
    }

    @Transactional
    public void respondToAssignment(String email, Long orderId, boolean accept) {
        Driver driver = getDriverByEmail(email);
        Order order = orderRepository.findByIdAndDriverId(orderId, driver.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Assigned order not found"));
        if (accept) {
            order.setDriverAssignmentStatus(DriverAssignmentStatus.ACCEPTED);
            order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
            notificationService.createNotification(order.getUser(), NotificationType.DELIVERY_ALERT,
                    "Driver accepted your order", "Your driver is on the way for order #" + order.getId(), "Order", String.valueOf(order.getId()));
        } else {
            order.setDriverAssignmentStatus(DriverAssignmentStatus.REJECTED);
            driver.setAvailable(driver.isActive());
            order.setDriver(null);
        }
        orderRepository.save(order);
        driverRepository.save(driver);
    }

    @Transactional(readOnly = true)
    public Driver getDriverByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Driver user not found with email: " + email));
        return driverRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found"));
    }

    @Transactional(readOnly = true)
    public Driver getRestaurantDriver(String managerEmail, Long restaurantId, Long driverId) {
        Restaurant restaurant = getManagedRestaurant(managerEmail, restaurantId);
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + driverId));
        if (driver.getRestaurant() == null || !driver.getRestaurant().getId().equals(restaurant.getId())) {
            throw new AccessDeniedException("You can only manage drivers that belong to your restaurant.");
        }
        return driver;
    }

    @Transactional(readOnly = true)
    public Restaurant getManagedRestaurant(String managerEmail, Long restaurantId) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + managerEmail));

        if (restaurantId != null) {
            return manager.getManagedRestaurants().stream()
                    .filter(restaurant -> restaurant.getId().equals(restaurantId))
                    .findFirst()
                    .orElseThrow(() -> new AccessDeniedException("You do not manage the requested restaurant."));
        }

        return manager.getManagedRestaurants().stream()
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException("You do not manage any restaurants."));
    }

    private Specification<Driver> buildDriverSearchSpecification(String search, Boolean active) {
        Specification<Driver> specification = (root, query, cb) -> cb.conjunction();
        if (active != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("active"), active));
        }
        if (search != null && !search.isBlank()) {
            String term = "%" + search.trim().toLowerCase() + "%";
            specification = specification.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.join("user").get("fullName")), term),
                    cb.like(cb.lower(root.join("user").get("email")), term),
                    cb.like(cb.lower(root.join("user").get("phoneNumber")), term),
                    cb.like(cb.lower(root.get("vehicleType")), term),
                    cb.like(cb.lower(root.get("licensePlate")), term)
            ));
        }
        return specification;
    }

    private DriverDTO updateDriverActiveState(Driver driver, boolean active, String actor, Map<String, Object> metadata) {
        driver.setActive(active);
        driver.setAvailable(active && driver.isAvailable());
        driver.getUser().setActive(active);
        Driver saved = driverRepository.save(driver);
        userRepository.save(saved.getUser());
        auditLogService.log("DRIVER_STATUS_CHANGED", actor, "Driver", String.valueOf(driver.getId()), metadata);
        return DriverDTO.fromEntity(saved);
    }

    private DriverDTO assignOrder(Order order, Driver driver, String actor, String title, String message) {
        if (driver.getRestaurant() != null && !driver.getRestaurant().getId().equals(order.getRestaurant().getId())) {
            throw new AccessDeniedException("Driver can only be assigned to orders from their restaurant.");
        }
        if (!driver.isActive()) {
            throw new IllegalStateException("Selected driver is inactive.");
        }
        if (!driver.isOnline()) {
            throw new IllegalStateException("Selected driver is offline.");
        }
        if (!driver.isAvailable()) {
            throw new IllegalStateException("Selected driver is currently unavailable.");
        }

        order.setDriver(driver);
        order.setDriverAssignmentStatus(DriverAssignmentStatus.PENDING_DRIVER_RESPONSE);
        driver.setAvailable(false);
        orderRepository.save(order);
        driverRepository.save(driver);
        notificationService.createNotification(driver.getUser(), NotificationType.DRIVER_ASSIGNMENT,
                title, message, "Order", String.valueOf(order.getId()));
        auditLogService.log("DRIVER_ASSIGNED", actor, "Order", String.valueOf(order.getId()),
                Map.of("driverId", driver.getId(), "restaurantId", order.getRestaurant().getId()));
        return DriverDTO.fromEntity(driver);
    }
}
