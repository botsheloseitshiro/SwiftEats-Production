package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.order.OrderRequest;
import com.swifteats.swifteats.model.Restaurant;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.DriverRepository;
import com.swifteats.swifteats.repository.MenuItemRepository;
import com.swifteats.swifteats.repository.OrderRepository;
import com.swifteats.swifteats.repository.RestaurantRepository;
import com.swifteats.swifteats.repository.SavedCardRepository;
import com.swifteats.swifteats.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OrderServiceTest {

    @Test
    void shouldRejectDuplicateMenuItemsInSingleOrder() {
        OrderRepository orderRepository = mock(OrderRepository.class);
        MenuItemRepository menuItemRepository = mock(MenuItemRepository.class);
        RestaurantRepository restaurantRepository = mock(RestaurantRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        SavedCardRepository savedCardRepository = mock(SavedCardRepository.class);
        DriverRepository driverRepository = mock(DriverRepository.class);
        AuditLogService auditLogService = mock(AuditLogService.class);

        OrderService service = new OrderService(orderRepository, menuItemRepository, restaurantRepository, userRepository, savedCardRepository, driverRepository, auditLogService);

        User user = User.builder().id(1L).email("test@example.com").address("Main Street").build();
        Restaurant restaurant = Restaurant.builder()
                .id(5L)
                .active(true)
                .deliveryFee(BigDecimal.TEN)
                .mondayHours("00:00-23:59")
                .tuesdayHours("00:00-23:59")
                .wednesdayHours("00:00-23:59")
                .thursdayHours("00:00-23:59")
                .fridayHours("00:00-23:59")
                .saturdayHours("00:00-23:59")
                .sundayHours("00:00-23:59")
                .build();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(restaurantRepository.findById(5L)).thenReturn(Optional.of(restaurant));

        OrderRequest.OrderItemRequest itemA = new OrderRequest.OrderItemRequest();
        itemA.setMenuItemId(10L);
        itemA.setQuantity(1);
        OrderRequest.OrderItemRequest itemB = new OrderRequest.OrderItemRequest();
        itemB.setMenuItemId(10L);
        itemB.setQuantity(2);

        OrderRequest request = new OrderRequest();
        request.setRestaurantId(5L);
        request.setDeliveryAddress("Main Street");
        request.setItems(List.of(itemA, itemB));

        assertThatThrownBy(() -> service.placeOrder(request, "test@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Duplicate menu items");
    }
}
