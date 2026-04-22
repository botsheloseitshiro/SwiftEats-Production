package com.swifteats.swifteats.controller;

import com.swifteats.swifteats.dto.favorite.FavoriteRestaurantDTO;
import com.swifteats.swifteats.service.FavoriteRestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/favorites", "/api/v1/favorites"})
@RequiredArgsConstructor
public class FavoriteRestaurantController {

    private final FavoriteRestaurantService favoriteRestaurantService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<FavoriteRestaurantDTO>> getFavorites() {
        return ResponseEntity.ok(favoriteRestaurantService.getFavorites());
    }

    @PostMapping("/restaurants/{restaurantId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<FavoriteRestaurantDTO> addFavorite(@PathVariable Long restaurantId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(favoriteRestaurantService.addFavorite(restaurantId));
    }

    @DeleteMapping("/restaurants/{restaurantId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> removeFavorite(@PathVariable Long restaurantId) {
        favoriteRestaurantService.removeFavorite(restaurantId);
        return ResponseEntity.noContent().build();
    }
}
