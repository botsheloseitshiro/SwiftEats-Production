package com.swifteats.swifteats.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    private final Map<String, RateLimitBucket> buckets = new ConcurrentHashMap<>();

    @Value("${app.rate-limit.auth.window-seconds:60}")
    private long authWindowSeconds;

    @Value("${app.rate-limit.auth.max-requests:10}")
    private int authMaxRequests;

    @Value("${app.rate-limit.forgot-password.window-seconds:900}")
    private long forgotPasswordWindowSeconds;

    @Value("${app.rate-limit.forgot-password.max-requests:3}")
    private int forgotPasswordMaxRequests;

    @Value("${app.rate-limit.refresh.window-seconds:300}")
    private long refreshWindowSeconds;

    @Value("${app.rate-limit.refresh.max-requests:20}")
    private int refreshMaxRequests;

    public boolean isProtected(HttpServletRequest request) {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return false;
        }

        String path = request.getRequestURI();
        return "/api/auth/login".equals(path)
                || "/api/auth/register".equals(path)
                || "/api/auth/forgot-password".equals(path)
                || "/api/auth/reset-password".equals(path)
                || "/api/auth/refresh".equals(path);
    }

    public String resolveClientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    public RateLimitDecision checkLimit(HttpServletRequest request, String clientKey) {
        RateLimitPolicy policy = resolvePolicy(request.getRequestURI());
        long now = Instant.now().getEpochSecond();

        String bucketKey = request.getRequestURI() + "|" + clientKey;
        RateLimitBucket bucket = buckets.compute(bucketKey, (key, existing) -> {
            if (existing == null || now >= existing.windowStartEpochSecond + policy.windowSeconds()) {
                return new RateLimitBucket(now, 1);
            }
            existing.requestCount++;
            return existing;
        });

        cleanupExpiredBuckets(now);

        if (bucket.requestCount <= policy.maxRequests()) {
            return new RateLimitDecision(true, 0);
        }

        long retryAfter = Math.max(1, (bucket.windowStartEpochSecond + policy.windowSeconds()) - now);
        return new RateLimitDecision(false, retryAfter);
    }

    private RateLimitPolicy resolvePolicy(String path) {
        if ("/api/auth/forgot-password".equals(path)) {
            return new RateLimitPolicy(forgotPasswordWindowSeconds, forgotPasswordMaxRequests);
        }
        if ("/api/auth/refresh".equals(path)) {
            return new RateLimitPolicy(refreshWindowSeconds, refreshMaxRequests);
        }
        return new RateLimitPolicy(authWindowSeconds, authMaxRequests);
    }

    private void cleanupExpiredBuckets(long now) {
        buckets.entrySet().removeIf(entry -> {
            String path = entry.getKey().split("\\|", 2)[0];
            RateLimitPolicy policy = resolvePolicy(path);
            RateLimitBucket bucket = entry.getValue();
            return now >= bucket.windowStartEpochSecond + policy.windowSeconds();
        });
    }

    private static class RateLimitBucket {
        private final long windowStartEpochSecond;
        private int requestCount;

        private RateLimitBucket(long windowStartEpochSecond, int requestCount) {
            this.windowStartEpochSecond = windowStartEpochSecond;
            this.requestCount = requestCount;
        }
    }

    private record RateLimitPolicy(long windowSeconds, int maxRequests) {
    }
}
