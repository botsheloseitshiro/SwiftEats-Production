package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.favorite.FavoriteRestaurantDTO;
import com.swifteats.swifteats.exception.ResourceNotFoundException;
import com.swifteats.swifteats.model.FavoriteRestaurant;
import com.swifteats.swifteats.model.Restaurant;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.FavoriteRestaurantRepository;
import com.swifteats.swifteats.repository.RestaurantRepository;
import com.swifteats.swifteats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteRestaurantService {

    private final FavoriteRestaurantRepository favoriteRestaurantRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public FavoriteRestaurantDTO addFavorite(Long restaurantId) {
        User user = currentUser();
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        FavoriteRestaurant favoriteRestaurant = favoriteRestaurantRepository.findByUserIdAndRestaurantId(user.getId(), restaurantId)
                .orElseGet(() -> favoriteRestaurantRepository.save(FavoriteRestaurant.builder()
                        .user(user)
                        .restaurant(restaurant)
                        .build()));
        auditLogService.log("FAVORITE_ADDED", user.getEmail(), "Restaurant", String.valueOf(restaurantId), java.util.Map.of());
        return FavoriteRestaurantDTO.fromEntity(favoriteRestaurant);
    }

    @Transactional(readOnly = true)
    public List<FavoriteRestaurantDTO> getFavorites() {
        return favoriteRestaurantRepository.findByUserIdOrderByCreatedAtDesc(currentUser().getId())
                .stream()
                .map(FavoriteRestaurantDTO::fromEntity)
                .toList();
    }

    @Transactional
    public void removeFavorite(Long restaurantId) {
        User user = currentUser();
        FavoriteRestaurant favoriteRestaurant = favoriteRestaurantRepository.findByUserIdAndRestaurantId(user.getId(), restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Favorite not found"));
        favoriteRestaurantRepository.delete(favoriteRestaurant);
        auditLogService.log("FAVORITE_REMOVED", user.getEmail(), "Restaurant", String.valueOf(restaurantId), java.util.Map.of());
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
