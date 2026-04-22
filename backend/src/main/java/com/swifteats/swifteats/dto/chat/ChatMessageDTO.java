package com.swifteats.swifteats.dto.chat;

import com.swifteats.swifteats.model.ChatMessage;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChatMessageDTO {
    private Long id;
    private Long orderId;
    private String channelType;
    private Long senderId;
    private String senderName;
    private Long recipientId;
    private String recipientName;
    private String message;
    private LocalDateTime createdAt;

    public static ChatMessageDTO fromEntity(ChatMessage message) {
        return ChatMessageDTO.builder()
                .id(message.getId())
                .orderId(message.getOrder().getId())
                .channelType(message.getChannelType().name())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
                .recipientId(message.getRecipient().getId())
                .recipientName(message.getRecipient().getFullName())
                .message(message.getMessage())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
