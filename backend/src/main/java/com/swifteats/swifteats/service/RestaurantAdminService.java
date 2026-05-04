package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.restaurant.RegisterRestaurantRequest;
import com.swifteats.swifteats.dto.restaurant.RestaurantRegistrationResponse;
import com.swifteats.swifteats.exception.ResourceAlreadyExistsException;
import com.swifteats.swifteats.model.Restaurant;
import com.swifteats.swifteats.model.Role;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.RestaurantRepository;
import com.swifteats.swifteats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestaurantAdminService {

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final GeocodingService geocodingService;

    @Transactional
    public RestaurantRegistrationResponse registerRestaurant(RegisterRestaurantRequest request) {
        String normalizedAdminEmail = User.normalizeEmail(request.getAdminEmail());

        // Step 1: Check if admin email already exists
        if (userRepository.existsByEmail(normalizedAdminEmail)) {
            throw new ResourceAlreadyExistsException(
                    "An account with email '" + normalizedAdminEmail + "' already exists.");
        }

        // Step 2: Create RESTAURANT_ADMIN user account
        User restaurantAdmin = User.builder()
                .fullName(request.getAdminFullName())
                .email(normalizedAdminEmail)
                .password(passwordEncoder.encode(request.getAdminPassword()))
                .role(Role.RESTAURANT_ADMIN)
                .active(true)
                .build();

        User savedAdmin = userRepository.save(restaurantAdmin);
        log.info("Restaurant admin account created: {} ({})", request.getAdminFullName(), normalizedAdminEmail);

        // Step 3: Create the restaurant
        GeocodingService.Coordinates coordinates = request.getLatitude() != null && request.getLongitude() != null
                ? new GeocodingService.Coordinates(request.getLatitude(), request.getLongitude())
                : geocodingService.geocode(request.getAddress(), request.getCity());

        Restaurant restaurant = Restaurant.builder()
                .name(request.getName())
                .description(request.getDescription())
                .address(request.getAddress())
                .city(request.getCity())
                .latitude(coordinates != null ? coordinates.latitude() : request.getLatitude())
                .longitude(coordinates != null ? coordinates.longitude() : request.getLongitude())
                .deliveryRadiusKm(request.getDeliveryRadiusKm() != null ? request.getDeliveryRadiusKm() : 10.0)
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .deliveryTimeMinutes(request.getDeliveryTimeMinutes() != null ? request.getDeliveryTimeMinutes() : 30)
                .deliveryFee(request.getDeliveryFee() != null ? request.getDeliveryFee() : BigDecimal.valueOf(25.00))
                .rating(0.0)  // New restaurants start with no rating
                .manager(savedAdmin)  // Associate the restaurant admin
                .active(true)
                .acceptingOrders(true)
                .build();

        Restaurant savedRestaurant = restaurantRepository.save(restaurant);
        log.info("Restaurant registered: '{}' managed by {}", request.getName(), normalizedAdminEmail);

        // Step 4: Return response
        return RestaurantRegistrationResponse.builder()
                .restaurantId(savedRestaurant.getId())
                .restaurantName(savedRestaurant.getName())
                .restaurantAddress(savedRestaurant.getAddress())
                .adminUserId(savedAdmin.getId())
                .adminFullName(savedAdmin.getFullName())
                .adminEmail(savedAdmin.getEmail())
                .message("Restaurant registered successfully! The admin can now login with the provided email and password.")
                .build();
    }

    @Transactional(readOnly = true)
    public User getRestaurantAdminByEmail(String email) {
        return userRepository.findByEmail(email)
                .filter(u -> u.getRole() == Role.RESTAURANT_ADMIN)
                .orElse(null);
    }
}
