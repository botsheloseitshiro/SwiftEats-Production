package com.swifteats.swifteats.controller;

import com.swifteats.swifteats.dto.RestaurantDTO;
import com.swifteats.swifteats.dto.common.PaginatedResponse;
import com.swifteats.swifteats.dto.restaurant.RegisterRestaurantRequest;
import com.swifteats.swifteats.dto.restaurant.RestaurantRegistrationResponse;
import com.swifteats.swifteats.service.RestaurantAdminService;
import com.swifteats.swifteats.service.RestaurantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/restaurants", "/api/v1/restaurants"})
@RequiredArgsConstructor
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final RestaurantAdminService restaurantAdminService;

    @GetMapping("/nearby")
    public ResponseEntity<List<RestaurantDTO>> getNearbyRestaurants(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "10") double radiusKm) {
        return ResponseEntity.ok(restaurantService.getNearbyRestaurants(lat, lon, radiusKm));
    }

    @GetMapping
    public ResponseEntity<List<RestaurantDTO>> getAllRestaurants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {
        if (search != null && !search.isEmpty()) {
            return ResponseEntity.ok(restaurantService.searchByName(search));
        }
        if (category != null && !category.isEmpty()) {
            return ResponseEntity.ok(restaurantService.getByCategory(category));
        }
        return ResponseEntity.ok(restaurantService.getAllActiveRestaurants());
    }

    @GetMapping("/browse")
    public ResponseEntity<PaginatedResponse<RestaurantDTO>> browseRestaurants(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @ParameterObject @PageableDefault(size = 9) Pageable pageable) {
        return ResponseEntity.ok(restaurantService.browseActiveRestaurants(search, category, pageable));
    }

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RestaurantRegistrationResponse> registerRestaurant(@Valid @RequestBody RegisterRestaurantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(restaurantAdminService.registerRestaurant(request));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaginatedResponse<RestaurantDTO>> getAllRestaurantsForAdmin(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @ParameterObject @PageableDefault(size = 9) Pageable pageable) {
        return ResponseEntity.ok(restaurantService.getAdminRestaurants(search, active, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantDTO> getRestaurantById(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantService.getRestaurantById(id));
    }

    @PutMapping("/{id}/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT_ADMIN')")
    public ResponseEntity<RestaurantDTO> toggleRestaurantActive(@PathVariable Long id, @RequestBody Map<String, Boolean> request) {
        return ResponseEntity.ok(restaurantService.updateRestaurantActive(id, request.getOrDefault("active", true)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RestaurantDTO> createRestaurant(@Valid @RequestBody RestaurantDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(restaurantService.createRestaurant(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RESTAURANT_ADMIN')")
    public ResponseEntity<RestaurantDTO> updateRestaurant(@PathVariable Long id, @Valid @RequestBody RestaurantDTO dto) {
        return ResponseEntity.ok(restaurantService.updateRestaurant(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRestaurant(@PathVariable Long id) {
        restaurantService.deleteRestaurant(id);
        return ResponseEntity.noContent().build();
    }
}
