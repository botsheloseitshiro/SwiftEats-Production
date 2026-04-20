package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.review.ReviewRequest;
import com.swifteats.swifteats.dto.review.ReviewResponse;
import com.swifteats.swifteats.exception.ResourceNotFoundException;
import com.swifteats.swifteats.model.MenuItem;
import com.swifteats.swifteats.model.Order;
import com.swifteats.swifteats.model.OrderItem;
import com.swifteats.swifteats.model.OrderStatus;
import com.swifteats.swifteats.model.Restaurant;
import com.swifteats.swifteats.model.Review;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.MenuItemRepository;
import com.swifteats.swifteats.repository.OrderRepository;
import com.swifteats.swifteats.repository.RestaurantRepository;
import com.swifteats.swifteats.repository.ReviewRepository;
import com.swifteats.swifteats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getRestaurantReviews(Long restaurantId) {
        return reviewRepository.findByRestaurantIdAndMenuItemIsNullOrderByCreatedAtDesc(restaurantId)
                .stream()
                .map(ReviewResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getMenuItemReviews(Long menuItemId) {
        return reviewRepository.findByMenuItemIdOrderByCreatedAtDesc(menuItemId)
                .stream()
                .map(ReviewResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyOrderReviews(String userEmail, Long orderId) {
        User user = getUser(userEmail);
        Order order = orderRepository.findById(orderId)
                .filter(existing -> existing.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("You can only view reviews for your own orders."));

        return reviewRepository.findByUserIdAndOrderId(user.getId(), order.getId()).stream()
                .map(ReviewResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ReviewResponse createRestaurantReview(String userEmail, Long restaurantId, ReviewRequest request) {
        User user = getUser(userEmail);
        Order order = getDeliveredOrder(user.getId(), request.getOrderId());
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found with id: " + restaurantId));

        if (!order.getRestaurant().getId().equals(restaurantId)) {
            throw new IllegalArgumentException("You can only review restaurants you ordered from.");
        }

        reviewRepository.findByUserIdAndOrderIdAndRestaurantIdAndMenuItemIsNull(user.getId(), order.getId(), restaurantId)
                .ifPresent(existing -> {
                    throw new IllegalStateException("You have already reviewed this restaurant for the selected order.");
                });

        Review saved = reviewRepository.save(Review.builder()
                .user(user)
                .order(order)
                .restaurant(restaurant)
                .rating(request.getRating())
                .comment(trimToNull(request.getComment()))
                .build());

        refreshRestaurantRating(restaurant);
        auditLogService.log("RESTAURANT_REVIEW_CREATED", userEmail, "Review", String.valueOf(saved.getId()),
                java.util.Map.of("restaurantId", restaurantId, "orderId", order.getId()));
        return ReviewResponse.fromEntity(saved);
    }

    @Transactional
    public ReviewResponse createMenuItemReview(String userEmail, Long menuItemId, ReviewRequest request) {
        User user = getUser(userEmail);
        Order order = getDeliveredOrder(user.getId(), request.getOrderId());
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + menuItemId));

        boolean orderedItem = order.getOrderItems().stream()
                .map(OrderItem::getMenuItem)
                .anyMatch(item -> item.getId().equals(menuItemId));
        if (!orderedItem) {
            throw new IllegalArgumentException("You can only review menu items that were part of your delivered order.");
        }

        reviewRepository.findByUserIdAndOrderIdAndMenuItemId(user.getId(), order.getId(), menuItemId)
                .ifPresent(existing -> {
                    throw new IllegalStateException("You have already reviewed this menu item for the selected order.");
                });

        Review saved = reviewRepository.save(Review.builder()
                .user(user)
                .order(order)
                .restaurant(order.getRestaurant())
                .menuItem(menuItem)
                .rating(request.getRating())
                .comment(trimToNull(request.getComment()))
                .build());

        auditLogService.log("MENU_ITEM_REVIEW_CREATED", userEmail, "Review", String.valueOf(saved.getId()),
                java.util.Map.of("menuItemId", menuItemId, "orderId", order.getId()));
        return ReviewResponse.fromEntity(saved);
    }

    private User getUser(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));
    }

    private Order getDeliveredOrder(Long userId, Long orderId) {
        return orderRepository.findById(orderId)
                .filter(order -> order.getUser().getId().equals(userId))
                .filter(order -> order.getStatus() == OrderStatus.DELIVERED)
                .orElseThrow(() -> new IllegalArgumentException("Only your delivered orders can be reviewed."));
    }

    private void refreshRestaurantRating(Restaurant restaurant) {
        Double averageRating = reviewRepository.findAverageRestaurantRating(restaurant.getId());
        restaurant.setRating(averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0);
        restaurantRepository.save(restaurant);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
