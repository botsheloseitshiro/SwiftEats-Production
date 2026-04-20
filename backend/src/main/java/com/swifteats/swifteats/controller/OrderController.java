package com.swifteats.swifteats.controller;

import com.swifteats.swifteats.dto.common.PaginatedResponse;
import com.swifteats.swifteats.dto.order.OrderRequest;
import com.swifteats.swifteats.dto.order.OrderResponse;
import com.swifteats.swifteats.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/orders", "/api/v1/orders"})
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(
            @Valid @RequestBody OrderRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        OrderResponse response = orderService.placeOrder(request, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-orders")
    public ResponseEntity<PaginatedResponse<OrderResponse>> getMyOrders(
            Authentication authentication,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(orderService.getMyOrders(authentication.getName(), pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable Long id,
            Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return ResponseEntity.ok(orderService.getOrderById(id, authentication.getName(), isAdmin));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'DRIVER')")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(orderService.updateOrderStatus(id, newStatus));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archiveMyOrder(@PathVariable Long id, Authentication authentication) {
        orderService.archiveMyOrder(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaginatedResponse<OrderResponse>> getAllOrders(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(orderService.getAllOrders(pageable));
    }

    @GetMapping("/driver/assigned")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<PaginatedResponse<OrderResponse>> getDriverOrders(
            Authentication authentication,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(orderService.getOrdersForDriver(authentication.getName(), pageable));
    }

    @GetMapping("/restaurant-admin/managed")
    @PreAuthorize("hasRole('RESTAURANT_ADMIN')")
    public ResponseEntity<PaginatedResponse<OrderResponse>> getManagedRestaurantOrders(
            Authentication authentication,
            @RequestParam(required = false) Long restaurantId,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(orderService.getOrdersForManagedRestaurant(authentication.getName(), restaurantId, status, pageable));
    }

    @PutMapping("/restaurant-admin/{id}/status")
    @PreAuthorize("hasRole('RESTAURANT_ADMIN')")
    public ResponseEntity<OrderResponse> updateManagedRestaurantOrderStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            Authentication authentication) {
        String newStatus = body.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(orderService.updateManagedRestaurantOrderStatus(id, newStatus, authentication.getName()));
    }
}
