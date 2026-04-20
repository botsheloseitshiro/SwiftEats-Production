package com.swifteats.swifteats.model;

/**
 * OrderStatus — The lifecycle stages of a delivery order
 * ======================================================
 *
 * An order progresses through these states:
 *
 *   PENDING → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED
 *                                                       ↘ CANCELLED
 *
 * State descriptions:
 *   PENDING           : Order placed, waiting for restaurant to confirm
 *   CONFIRMED         : Restaurant accepted the order
 *   PREPARING         : Kitchen is preparing the food
 *   OUT_FOR_DELIVERY  : Driver picked up, on the way to customer
 *   DELIVERED         : Customer received the order
 *   CANCELLED         : Order was cancelled (before preparation started)
 *
 * Connected to:
 *   - Order.status field
 *   - OrderController: endpoints to update order status
 *   - Frontend: displayed as a progress tracker on the Order History page
 */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    PREPARING,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED
}