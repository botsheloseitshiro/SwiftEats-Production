package com.swifteats.swifteats.dto.review;

import com.swifteats.swifteats.model.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long orderId;
    private Long restaurantId;
    private Long menuItemId;
    private Integer rating;
    private String comment;
    private String reviewerName;
    private LocalDateTime createdAt;

    public static ReviewResponse fromEntity(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .orderId(review.getOrder().getId())
                .restaurantId(review.getRestaurant().getId())
                .menuItemId(review.getMenuItem() != null ? review.getMenuItem().getId() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .reviewerName(review.getUser().getFullName())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
