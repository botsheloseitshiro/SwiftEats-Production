package com.swifteats.swifteats.controller;

import com.swifteats.swifteats.dto.common.PaginatedResponse;
import com.swifteats.swifteats.dto.driver.AdminCreateDriverRequest;
import com.swifteats.swifteats.dto.driver.DriverDTO;
import com.swifteats.swifteats.dto.driver.DriverEarningsSummaryDTO;
import com.swifteats.swifteats.dto.driver.DriverLocationUpdateRequest;
import com.swifteats.swifteats.dto.driver.DriverShiftRequest;
import com.swifteats.swifteats.dto.driver.UpdateDriverRequest;
import com.swifteats.swifteats.service.DriverManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/drivers", "/api/v1/drivers"})
@RequiredArgsConstructor
public class DriverController {

    private final DriverManagementService driverManagementService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DriverDTO> createDriver(@Valid @RequestBody AdminCreateDriverRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(driverManagementService.createDriver(request));
    }

    @PostMapping("/restaurant-admin")
    @PreAuthorize("hasRole('RESTAURANT_ADMIN')")
    public ResponseEntity<DriverDTO> createDriverForRestaurant(@RequestParam(required = false) Long restaurantId,
                                                               @Valid @RequestBody AdminCreateDriverRequest request,
                                                               Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(driverManagementService.createDriverForRestaurant(authentication.getName(), restaurantId, request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaginatedResponse<DriverDTO>> getDrivers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @ParameterObject @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(driverManagementService.getDrivers(search, active, pageable));
    }

    @GetMapping("/restaurant-admin")
    @PreAuthorize("hasRole('RESTAURANT_ADMIN')")
    public ResponseEntity<PaginatedResponse<DriverDTO>> getRestaurantDrivers(
            @RequestParam(required = false) Long restaurantId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @ParameterObject @PageableDefault(size = 10) Pageable pageable,
            Authentication authentication) {
        return ResponseEntity.ok(driverManagementService.getDriversForRestaurant(authentication.getName(), restaurantId, search, active, pageable));
    }

    @PutMapping("/{id}/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DriverDTO> setDriverActive(@PathVariable Long id, @RequestBody Map<String, Boolean> request) {
        return ResponseEntity.ok(driverManagementService.setDriverActive(id, request.getOrDefault("active", true)));
    }

    @PutMapping("/restaurant-admin/{id}")
    @PreAuthorize("hasRole('RESTAURANT_ADMIN')")
    public ResponseEntity<DriverDTO> updateRestaurantDriver(@PathVariable Long id,
                                                            @RequestParam(required = false) Long restaurantId,
                                                            @Valid @RequestBody UpdateDriverRequest request,
                                                            Authentication authentication) {
        return ResponseEntity.ok(driverManagementService.updateDriverForRestaurant(authentication.getName(), restaurantId, id, request));
    }

    @PutMapping("/restaurant-admin/{id}/active")
    @PreAuthorize("hasRole('RESTAURANT_ADMIN')")
    public ResponseEntity<DriverDTO> setRestaurantDriverActive(@PathVariable Long id,
                                                               @RequestParam(required = false) Long restaurantId,
                                                               @RequestBody Map<String, Boolean> request,
                                                               Authentication authentication) {
        return ResponseEntity.ok(driverManagementService.setDriverActiveForRestaurant(
                authentication.getName(), restaurantId, id, request.getOrDefault("active", true)));
    }

    @PutMapping("/restaurant-admin/{id}/availability")
    @PreAuthorize("hasRole('RESTAURANT_ADMIN')")
    public ResponseEntity<DriverDTO> setRestaurantDriverAvailability(@PathVariable Long id,
                                                                     @RequestParam(required = false) Long restaurantId,
                                                                     @RequestBody Map<String, Boolean> request,
                                                                     Authentication authentication) {
        return ResponseEntity.ok(driverManagementService.setDriverAvailabilityForRestaurant(
                authentication.getName(), restaurantId, id, request.getOrDefault("available", true)));
    }

    @PutMapping("/{id}/assignments/{orderId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DriverDTO> manuallyAssignOrder(@PathVariable Long id, @PathVariable Long orderId, Authentication authentication) {
        return ResponseEntity.ok(driverManagementService.assignOrderToDriver(orderId, id, authentication.getName()));
    }

    @PutMapping("/restaurant-admin/{id}/assignments/{orderId}")
    @PreAuthorize("hasRole('RESTAURANT_ADMIN')")
    public ResponseEntity<DriverDTO> manuallyAssignOrderForRestaurant(@PathVariable Long id,
                                                                      @PathVariable Long orderId,
                                                                      @RequestParam(required = false) Long restaurantId,
                                                                      Authentication authentication) {
        return ResponseEntity.ok(driverManagementService.assignOrderToRestaurantDriver(orderId, id, authentication.getName(), restaurantId));
    }

    @PutMapping("/me/location")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverDTO> updateLocation(@Valid @RequestBody DriverLocationUpdateRequest request, Authentication authentication) {
        return ResponseEntity.ok(driverManagementService.updateCurrentDriverLocation(authentication.getName(), request));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverDTO> getCurrentDriver(Authentication authentication) {
        return ResponseEntity.ok(driverManagementService.getCurrentDriver(authentication.getName()));
    }

    @PutMapping("/me/shift")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverDTO> updateShift(@Valid @RequestBody DriverShiftRequest request, Authentication authentication) {
        return ResponseEntity.ok(driverManagementService.updateCurrentDriverShift(authentication.getName(), request));
    }

    @PutMapping("/me/availability")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverDTO> updateAvailability(@RequestBody Map<String, Boolean> request, Authentication authentication) {
        return ResponseEntity.ok(driverManagementService.updateCurrentDriverAvailability(
                authentication.getName(), request.getOrDefault("available", true)));
    }

    @PostMapping("/me/orders/{orderId}/response")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<Void> respondToAssignment(@PathVariable Long orderId, @RequestBody Map<String, Boolean> request,
                                                    Authentication authentication) {
        driverManagementService.respondToAssignment(authentication.getName(), orderId, request.getOrDefault("accept", false));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/earnings")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DriverEarningsSummaryDTO> getEarnings(Authentication authentication) {
        return ResponseEntity.ok(driverManagementService.getEarningsSummary(authentication.getName()));
    }
}
