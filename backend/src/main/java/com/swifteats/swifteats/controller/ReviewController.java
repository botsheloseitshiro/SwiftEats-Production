package com.swifteats.swifteats.controller;

import com.swifteats.swifteats.dto.review.ReviewRequest;
import com.swifteats.swifteats.dto.review.ReviewResponse;
import com.swifteats.swifteats.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/reviews", "/api/v1/reviews"})
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/restaurants/{restaurantId}")
    public ResponseEntity<List<ReviewResponse>> getRestaurantReviews(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(reviewService.getRestaurantReviews(restaurantId));
    }

    @GetMapping("/menu-items/{menuItemId}")
    public ResponseEntity<List<ReviewResponse>> getMenuItemReviews(@PathVariable Long menuItemId) {
        return ResponseEntity.ok(reviewService.getMenuItemReviews(menuItemId));
    }

    @GetMapping("/orders/{orderId}/mine")
    public ResponseEntity<List<ReviewResponse>> getMyOrderReviews(
            @PathVariable Long orderId,
            Authentication authentication) {
        return ResponseEntity.ok(reviewService.getMyOrderReviews(authentication.getName(), orderId));
    }

    @PostMapping("/restaurants/{restaurantId}")
    public ResponseEntity<ReviewResponse> createRestaurantReview(
            @PathVariable Long restaurantId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createRestaurantReview(authentication.getName(), restaurantId, request));
    }

    @PostMapping("/menu-items/{menuItemId}")
    public ResponseEntity<ReviewResponse> createMenuItemReview(
            @PathVariable Long menuItemId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createMenuItemReview(authentication.getName(), menuItemId, request));
    }
}
