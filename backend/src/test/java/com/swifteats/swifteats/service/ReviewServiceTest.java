package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.review.ReviewRequest;
import com.swifteats.swifteats.model.Order;
import com.swifteats.swifteats.model.OrderStatus;
import com.swifteats.swifteats.model.Restaurant;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.MenuItemRepository;
import com.swifteats.swifteats.repository.OrderRepository;
import com.swifteats.swifteats.repository.RestaurantRepository;
import com.swifteats.swifteats.repository.ReviewRepository;
import com.swifteats.swifteats.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReviewServiceTest {

    @Test
    void shouldOnlyAllowDeliveredOrdersToBeReviewed() {
        ReviewRepository reviewRepository = mock(ReviewRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        RestaurantRepository restaurantRepository = mock(RestaurantRepository.class);
        MenuItemRepository menuItemRepository = mock(MenuItemRepository.class);
        AuditLogService auditLogService = mock(AuditLogService.class);

        ReviewService service = new ReviewService(reviewRepository, orderRepository, userRepository, restaurantRepository, menuItemRepository, auditLogService);

        User user = User.builder().id(1L).email("test@example.com").build();
        Restaurant restaurant = Restaurant.builder().id(7L).build();
        Order order = Order.builder().id(12L).user(user).restaurant(restaurant).status(OrderStatus.PREPARING).build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(orderRepository.findById(12L)).thenReturn(Optional.of(order));

        ReviewRequest request = ReviewRequest.builder().orderId(12L).rating(5).comment("Great").build();

        assertThatThrownBy(() -> service.createRestaurantReview("test@example.com", 7L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("delivered orders");
    }
}
