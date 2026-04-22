package com.swifteats.swifteats.repository;

import com.swifteats.swifteats.model.ChatChannelType;
import com.swifteats.swifteats.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByOrderIdAndChannelTypeOrderByCreatedAtAsc(Long orderId, ChatChannelType channelType);
}
