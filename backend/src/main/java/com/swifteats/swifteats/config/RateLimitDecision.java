package com.swifteats.swifteats.config;

public final class RateLimitDecision {

    private final boolean allowed;
    private final long retryAfterSeconds;

    public RateLimitDecision(boolean allowed, long retryAfterSeconds) {
        this.allowed = allowed;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public boolean allowed() {
        return allowed;
    }

    public long retryAfterSeconds() {
        return retryAfterSeconds;
    }
}
