package com.swifteats.swifteats.dto.order;

import com.swifteats.swifteats.model.Driver;
import com.swifteats.swifteats.model.Order;
import com.swifteats.swifteats.model.OrderStatus;
import com.swifteats.swifteats.model.Restaurant;
import com.swifteats.swifteats.model.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;

class OrderResponseTest {

    @Test
    void shouldHideDriverDetailsWhileOrderIsPending() {
        Order order = buildOrder(OrderStatus.PENDING);

        OrderResponse response = OrderResponse.fromEntity(order);

        assertThat(response.isDriverDetailsVisible()).isFalse();
        assertThat(response.getDriverName()).isNull();
        assertThat(response.getDriverLicensePlate()).isNull();
    }

    @Test
    void shouldExposeDriverDetailsOnceOrderIsConfirmed() {
        Order order = buildOrder(OrderStatus.CONFIRMED);

        OrderResponse response = OrderResponse.fromEntity(order);

        assertThat(response.isDriverDetailsVisible()).isTrue();
        assertThat(response.getDriverName()).isEqualTo("Sipho Ndlovu");
        assertThat(response.getDriverVehicleType()).isEqualTo("Motorcycle");
        assertThat(response.getDriverLicensePlate()).isEqualTo("GP 12 KLM 789");
    }

    private Order buildOrder(OrderStatus status) {
        User customer = User.builder().id(1L).email("customer@example.com").build();
        User driverUser = User.builder().id(2L).fullName("Sipho Ndlovu").email("sipho@driver.co.za").build();
        Driver driver = Driver.builder()
                .id(3L)
                .user(driverUser)
                .vehicleType("Motorcycle")
                .licensePlate("GP 12 KLM 789")
                .build();
        Restaurant restaurant = Restaurant.builder().id(4L).name("KFC").build();

        return Order.builder()
                .id(5L)
                .user(customer)
                .restaurant(restaurant)
                .status(status)
                .driver(driver)
                .totalAmount(BigDecimal.TEN)
                .subtotalAmount(BigDecimal.TEN)
                .deliveryFee(BigDecimal.ZERO)
                .tipAmount(BigDecimal.ZERO)
                .orderItems(new ArrayList<>())
                .build();
    }
}
