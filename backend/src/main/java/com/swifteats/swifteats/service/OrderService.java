package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.common.PaginatedResponse;
import com.swifteats.swifteats.dto.order.OrderRequest;
import com.swifteats.swifteats.dto.order.OrderResponse;
import com.swifteats.swifteats.exception.ResourceNotFoundException;
import com.swifteats.swifteats.model.CardType;
import com.swifteats.swifteats.model.Driver;
import com.swifteats.swifteats.model.FulfillmentType;
import com.swifteats.swifteats.model.MenuItem;
import com.swifteats.swifteats.model.Order;
import com.swifteats.swifteats.model.OrderItem;
import com.swifteats.swifteats.model.OrderStatus;
import com.swifteats.swifteats.model.PaymentMethod;
import com.swifteats.swifteats.model.Restaurant;
import com.swifteats.swifteats.model.SavedCard;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.DriverRepository;
import com.swifteats.swifteats.repository.MenuItemRepository;
import com.swifteats.swifteats.repository.OrderRepository;
import com.swifteats.swifteats.repository.RestaurantRepository;
import com.swifteats.swifteats.repository.SavedCardRepository;
import com.swifteats.swifteats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {
    private static final int MONEY_SCALE = 2;
    private static final ZoneId RESTAURANT_ZONE = ZoneId.of("Africa/Johannesburg");

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final SavedCardRepository savedCardRepository;
    private final DriverRepository driverRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public OrderResponse placeOrder(OrderRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Restaurant not found with id: " + request.getRestaurantId()));

        if (!restaurant.isActive()) {
            throw new IllegalStateException("Restaurant is currently not accepting orders.");
        }

        ZonedDateTime now = ZonedDateTime.now(RESTAURANT_ZONE);
        if (!restaurant.isOpenAt(now.getDayOfWeek(), now.toLocalTime())) {
            throw new IllegalStateException("Restaurant is currently closed.");
        }

        validateOrderItems(request);
        FulfillmentType fulfillmentType = parseFulfillmentType(request.getFulfillmentType());
        PaymentMethod paymentMethod = parsePaymentMethod(request.getPaymentMethod());
        BigDecimal deliveryFee = fulfillmentType == FulfillmentType.DELIVERY
                ? restaurant.getDeliveryFee().setScale(MONEY_SCALE, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        String deliveryAddress = resolveDeliveryAddress(user, request, fulfillmentType);
        BigDecimal tipAmount = normalizeMoney(request.getTipAmount());
        if (fulfillmentType == FulfillmentType.COLLECTION && tipAmount.compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalArgumentException("Tips are only available for delivery orders.");
        }

        Order order = Order.builder()
                .user(user)
                .restaurant(restaurant)
                .status(OrderStatus.PENDING)
                .fulfillmentType(fulfillmentType)
                .paymentMethod(paymentMethod)
                .deliveryFee(deliveryFee)
                .tipAmount(tipAmount)
                .deliveryAddress(deliveryAddress)
                .notes(request.getNotes())
                .orderItems(new ArrayList<>())
                .build();

        BigDecimal subtotalSum = BigDecimal.ZERO;

        for (OrderRequest.OrderItemRequest itemRequest : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemRequest.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Menu item not found with id: " + itemRequest.getMenuItemId()));

            if (!menuItem.getRestaurant().getId().equals(request.getRestaurantId())) {
                throw new IllegalArgumentException(
                        "Menu item '" + menuItem.getName() + "' does not belong to this restaurant");
            }

            if (!menuItem.isAvailable()) {
                throw new IllegalStateException("Menu item '" + menuItem.getName() + "' is not available");
            }

            BigDecimal unitPrice = menuItem.getDiscountedPrice();
            BigDecimal subtotal = unitPrice
                    .multiply(BigDecimal.valueOf(itemRequest.getQuantity()))
                    .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
            subtotalSum = subtotalSum.add(subtotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .menuItem(menuItem)
                    .itemName(menuItem.getName())
                    .unitPrice(unitPrice)
                    .quantity(itemRequest.getQuantity())
                    .subtotal(subtotal)
                    .build();

            order.getOrderItems().add(orderItem);
        }

        applyPaymentDetails(order, request, user, paymentMethod);
        order.setSubtotalAmount(subtotalSum);
        BigDecimal totalAmount = subtotalSum
                .add(deliveryFee)
                .add(tipAmount)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        order.setTotalAmount(totalAmount);

        if (fulfillmentType == FulfillmentType.DELIVERY) {
            List<Driver> availableDrivers = driverRepository.findByAvailableTrue();
            if (!availableDrivers.isEmpty()) {
                Driver driver = availableDrivers.get(0);
                order.setDriver(driver);
                driver.setAvailable(false);
                driverRepository.save(driver);
                log.info("Driver {} assigned to order", driver.getUser().getFullName());
            }
        }

        Order savedOrder = orderRepository.save(order);
        log.info("Order placed: id={}, user={}, total={}", savedOrder.getId(), user.getEmail(), totalAmount);
        auditLogService.log("ORDER_PLACED", user.getEmail(), "Order", String.valueOf(savedOrder.getId()),
                Map.of(
                        "restaurantId", restaurant.getId(),
                        "totalAmount", totalAmount,
                        "status", savedOrder.getStatus(),
                        "fulfillmentType", savedOrder.getFulfillmentType(),
                        "paymentMethod", savedOrder.getPaymentMethod()
                ));
        return OrderResponse.fromEntity(savedOrder);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<OrderResponse> getMyOrders(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));

        Page<OrderResponse> page = orderRepository.findByUserIdAndArchivedByCustomerFalse(user.getId(), pageable)
                .map(OrderResponse::fromEntity);
        return PaginatedResponse.fromPage(page);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId, String userEmail, boolean isAdmin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!isAdmin && !order.getUser().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("You are not authorized to view this order.");
        }

        return OrderResponse.fromEntity(order);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        OrderStatus status;
        try {
            status = OrderStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid order status: " + newStatus);
        }

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(status);

        if (status == OrderStatus.DELIVERED && order.getDriver() != null) {
            Driver driver = order.getDriver();
            driver.setAvailable(true);
            driver.setTotalDeliveries(driver.getTotalDeliveries() + 1);
            driverRepository.save(driver);
        }

        if (status == OrderStatus.CANCELLED && order.getDriver() != null) {
            Driver driver = order.getDriver();
            driver.setAvailable(true);
            driverRepository.save(driver);
        }

        Order updated = orderRepository.save(order);
        log.info("Order {} status changed: {} -> {}", orderId, previousStatus, status);
        auditLogService.log("ORDER_STATUS_CHANGED", "system", "Order", String.valueOf(orderId),
                Map.of("from", previousStatus, "to", status));
        return OrderResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<OrderResponse> getAllOrders(Pageable pageable) {
        Page<OrderResponse> page = orderRepository.findAll(pageable)
                .map(OrderResponse::fromEntity);
        return PaginatedResponse.fromPage(page);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<OrderResponse> getOrdersForDriver(String driverEmail, Pageable pageable) {
        User driverUser = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with email: " + driverEmail));

        Driver driver = driverRepository.findByUserId(driverUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found for user: " + driverEmail));

        Page<OrderResponse> page = orderRepository.findByDriverId(driver.getId(), pageable)
                .map(OrderResponse::fromEntity);
        return PaginatedResponse.fromPage(page);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<OrderResponse> getOrdersForManagedRestaurant(String managerEmail, Long restaurantId, String status, Pageable pageable) {
        Restaurant restaurant = getManagedRestaurant(managerEmail, restaurantId);

        Page<OrderResponse> page;
        if (status != null && !status.isBlank()) {
            OrderStatus requestedStatus = parseStatus(status);
            page = orderRepository.findByRestaurantIdAndStatus(restaurant.getId(), requestedStatus, pageable)
                    .map(OrderResponse::fromEntity);
        } else {
            page = orderRepository.findByRestaurantId(restaurant.getId(), pageable)
                    .map(OrderResponse::fromEntity);
        }

        return PaginatedResponse.fromPage(page);
    }

    @Transactional
    public OrderResponse updateManagedRestaurantOrderStatus(Long orderId, String newStatus, String managerEmail) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!managerCanAccessRestaurant(managerEmail, order.getRestaurant().getId())) {
            throw new AccessDeniedException("You can only manage orders for your own restaurant.");
        }

        OrderStatus status = parseStatus(newStatus);
        if (!(status == OrderStatus.CONFIRMED || status == OrderStatus.PREPARING || status == OrderStatus.CANCELLED)) {
            throw new IllegalArgumentException("Restaurant admins can only set order status to CONFIRMED, PREPARING, or CANCELLED.");
        }

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(status);
        Order updated = orderRepository.save(order);
        auditLogService.log("RESTAURANT_ADMIN_ORDER_STATUS_CHANGED", managerEmail, "Order", String.valueOf(orderId),
                Map.of("from", previousStatus, "to", status, "restaurantId", order.getRestaurant().getId()));
        return OrderResponse.fromEntity(updated);
    }

    @Transactional
    public void archiveMyOrder(Long orderId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You can only archive your own orders.");
        }
        if (!(order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.CANCELLED)) {
            throw new IllegalStateException("Only delivered or cancelled orders can be archived.");
        }

        order.setArchivedByCustomer(true);
        orderRepository.save(order);
        auditLogService.log("ORDER_ARCHIVED_BY_CUSTOMER", userEmail, "Order", String.valueOf(orderId), Map.of());
    }

    private void validateOrderItems(OrderRequest request) {
        Set<Long> menuItemIds = new HashSet<>();
        for (OrderRequest.OrderItemRequest item : request.getItems()) {
            if (!menuItemIds.add(item.getMenuItemId())) {
                throw new IllegalArgumentException("Duplicate menu items are not allowed in a single order.");
            }
        }
    }

    private String resolveDeliveryAddress(User user, OrderRequest request, FulfillmentType fulfillmentType) {
        if (fulfillmentType == FulfillmentType.COLLECTION) {
            return null;
        }

        String deliveryAddress = request.getDeliveryAddress() != null && !request.getDeliveryAddress().isBlank()
                ? request.getDeliveryAddress().trim()
                : user.getAddress();
        if (deliveryAddress == null || deliveryAddress.isBlank()) {
            throw new IllegalArgumentException("A delivery address is required to place an order.");
        }
        return deliveryAddress;
    }

    private void applyPaymentDetails(Order order, OrderRequest request, User user, PaymentMethod paymentMethod) {
        if (paymentMethod == PaymentMethod.CASH_ON_DELIVERY) {
            if (order.getFulfillmentType() != FulfillmentType.DELIVERY) {
                throw new IllegalArgumentException("Cash on delivery is only available for delivery orders.");
            }
            order.setCardType(null);
            order.setCardLastFour(null);
            return;
        }

        if (request.getSavedCardId() != null) {
            SavedCard savedCard = savedCardRepository.findByIdAndUserId(request.getSavedCardId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Saved card not found"));
            order.setCardType(savedCard.getCardType());
            order.setCardLastFour(savedCard.getLastFourDigits());
            return;
        }

        OrderRequest.PaymentCardRequest card = request.getCard();
        if (card == null || card.getCardNumber() == null || card.getCardNumber().isBlank()) {
            throw new IllegalArgumentException("Card details are required for card payments.");
        }

        String sanitizedCardNumber = sanitizeCardNumber(card.getCardNumber());
        CardType cardType = resolveCardType(sanitizedCardNumber);
        order.setCardType(cardType);
        order.setCardLastFour(lastFour(sanitizedCardNumber));

        if (request.isSaveCard()) {
            saveCardForUser(user, card, sanitizedCardNumber);
        }
    }

    private void saveCardForUser(User user, OrderRequest.PaymentCardRequest card, String sanitizedCardNumber) {
        boolean hasCards = !savedCardRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(user.getId()).isEmpty();

        SavedCard savedCard = SavedCard.builder()
                .user(user)
                .cardHolderName(card.getCardHolderName() == null ? user.getFullName() : card.getCardHolderName().trim())
                .cardType(resolveCardType(sanitizedCardNumber))
                .lastFourDigits(lastFour(sanitizedCardNumber))
                .expiryMonth(card.getExpiryMonth())
                .expiryYear(card.getExpiryYear())
                .isDefault(!hasCards)
                .build();
        savedCardRepository.save(savedCard);
    }

    private FulfillmentType parseFulfillmentType(String value) {
        if (value == null || value.isBlank()) {
            return FulfillmentType.DELIVERY;
        }
        try {
            return FulfillmentType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid fulfillment type: " + value);
        }
    }

    private PaymentMethod parsePaymentMethod(String value) {
        if (value == null || value.isBlank()) {
            return PaymentMethod.CARD;
        }
        try {
            return PaymentMethod.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid payment method: " + value);
        }
    }

    private BigDecimal normalizeMoney(BigDecimal amount) {
        if (amount == null) {
            return BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amounts cannot be negative.");
        }
        return amount.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private CardType resolveCardType(String cardNumber) {
        if (cardNumber.startsWith("4")) {
            return CardType.VISA;
        }
        if (cardNumber.startsWith("5")) {
            return CardType.MASTERCARD;
        }
        throw new IllegalArgumentException("Only Visa and Mastercard are supported.");
    }

    private String sanitizeCardNumber(String cardNumber) {
        String sanitized = cardNumber.replaceAll("\\s+", "");
        if (!sanitized.matches("\\d{16}")) {
            throw new IllegalArgumentException("Card number must contain exactly 16 digits.");
        }
        return sanitized;
    }

    private String lastFour(String cardNumber) {
        return cardNumber.substring(cardNumber.length() - 4);
    }

    private OrderStatus parseStatus(String newStatus) {
        try {
            return OrderStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid order status: " + newStatus);
        }
    }

    private Restaurant getManagedRestaurant(String managerEmail, Long restaurantId) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + managerEmail));

        if (restaurantId != null) {
            return manager.getManagedRestaurants().stream()
                    .filter(restaurant -> restaurant.getId().equals(restaurantId))
                    .findFirst()
                    .orElseThrow(() -> new AccessDeniedException("You do not manage the requested restaurant."));
        }

        return manager.getManagedRestaurants().stream()
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException("You do not manage any restaurants."));
    }

    private boolean managerCanAccessRestaurant(String managerEmail, Long restaurantId) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + managerEmail));

        return manager.getManagedRestaurants().stream()
                .anyMatch(restaurant -> restaurant.getId().equals(restaurantId));
    }
}
