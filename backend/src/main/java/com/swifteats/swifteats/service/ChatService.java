package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.chat.ChatMessageDTO;
import com.swifteats.swifteats.dto.chat.SendChatMessageRequest;
import com.swifteats.swifteats.exception.ResourceNotFoundException;
import com.swifteats.swifteats.model.ChatChannelType;
import com.swifteats.swifteats.model.ChatMessage;
import com.swifteats.swifteats.model.NotificationType;
import com.swifteats.swifteats.model.Order;
import com.swifteats.swifteats.model.Role;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.ChatMessageRepository;
import com.swifteats.swifteats.repository.OrderRepository;
import com.swifteats.swifteats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getMessages(Long orderId, ChatChannelType channelType, String email) {
        Order order = loadAuthorizedOrder(orderId, channelType, email);
        return chatMessageRepository.findByOrderIdAndChannelTypeOrderByCreatedAtAsc(order.getId(), channelType)
                .stream()
                .map(ChatMessageDTO::fromEntity)
                .toList();
    }

    @Transactional
    public ChatMessageDTO sendMessage(Long orderId, ChatChannelType channelType, SendChatMessageRequest request, String email) {
        Order order = loadAuthorizedOrder(orderId, channelType, email);
        User sender = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User recipient = resolveRecipient(order, channelType, sender);
        ChatMessage chatMessage = chatMessageRepository.save(ChatMessage.builder()
                .order(order)
                .sender(sender)
                .recipient(recipient)
                .channelType(channelType)
                .message(request.getMessage().trim())
                .build());
        notificationService.createNotification(recipient, NotificationType.SYSTEM,
                "New chat message", sender.getFullName() + " sent you a message about order #" + orderId,
                "Order", String.valueOf(orderId));
        return ChatMessageDTO.fromEntity(chatMessage);
    }

    private Order loadAuthorizedOrder(Long orderId, ChatChannelType channelType, String email) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        boolean allowed = switch (channelType) {
            case CUSTOMER_RESTAURANT -> order.getUser().getId().equals(user.getId())
                    || (order.getRestaurant().getManager() != null && order.getRestaurant().getManager().getId().equals(user.getId()))
                    || user.getRole() == Role.ADMIN;
            case CUSTOMER_DRIVER -> order.getUser().getId().equals(user.getId())
                    || (order.getDriver() != null && order.getDriver().getUser().getId().equals(user.getId()))
                    || user.getRole() == Role.ADMIN;
        };
        if (!allowed) {
            throw new AccessDeniedException("You are not allowed to access this chat");
        }
        return order;
    }

    private User resolveRecipient(Order order, ChatChannelType channelType, User sender) {
        return switch (channelType) {
            case CUSTOMER_RESTAURANT -> order.getUser().getId().equals(sender.getId())
                    ? order.getRestaurant().getManager()
                    : order.getUser();
            case CUSTOMER_DRIVER -> {
                if (order.getDriver() == null) {
                    throw new IllegalStateException("No driver assigned to this order.");
                }
                yield order.getUser().getId().equals(sender.getId()) ? order.getDriver().getUser() : order.getUser();
            }
        };
    }
}
