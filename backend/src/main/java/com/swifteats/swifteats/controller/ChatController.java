package com.swifteats.swifteats.controller;

import com.swifteats.swifteats.dto.chat.ChatMessageDTO;
import com.swifteats.swifteats.dto.chat.SendChatMessageRequest;
import com.swifteats.swifteats.model.ChatChannelType;
import com.swifteats.swifteats.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/chat", "/api/v1/chat"})
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/orders/{orderId}")
    public ResponseEntity<List<ChatMessageDTO>> getMessages(@PathVariable Long orderId,
                                                            @RequestParam ChatChannelType channelType,
                                                            Authentication authentication) {
        return ResponseEntity.ok(chatService.getMessages(orderId, channelType, authentication.getName()));
    }

    @PostMapping("/orders/{orderId}")
    public ResponseEntity<ChatMessageDTO> sendMessage(@PathVariable Long orderId,
                                                      @RequestParam ChatChannelType channelType,
                                                      @Valid @RequestBody SendChatMessageRequest request,
                                                      Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(chatService.sendMessage(orderId, channelType, request, authentication.getName()));
    }
}
