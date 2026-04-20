package com.swifteats.swifteats.dto.auth;

import lombok.Getter;

@Getter
public class MessageResponse {
    private final String message;
    private final String resetUrl;

    public MessageResponse(String message) {
        this(message, null);
    }

    public MessageResponse(String message, String resetUrl) {
        this.message = message;
        this.resetUrl = resetUrl;
    }
}
