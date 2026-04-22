package com.swifteats.swifteats.dto.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendChatMessageRequest {
    @NotBlank
    private String message;
}
