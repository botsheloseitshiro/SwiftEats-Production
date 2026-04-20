package com.swifteats.swifteats.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitingServiceTest {

    private RateLimitingService rateLimitingService;

    @BeforeEach
    void setUp() {
        rateLimitingService = new RateLimitingService();
        ReflectionTestUtils.setField(rateLimitingService, "authWindowSeconds", 60L);
        ReflectionTestUtils.setField(rateLimitingService, "authMaxRequests", 2);
        ReflectionTestUtils.setField(rateLimitingService, "forgotPasswordWindowSeconds", 900L);
        ReflectionTestUtils.setField(rateLimitingService, "forgotPasswordMaxRequests", 3);
        ReflectionTestUtils.setField(rateLimitingService, "refreshWindowSeconds", 300L);
        ReflectionTestUtils.setField(rateLimitingService, "refreshMaxRequests", 1);
    }

    @Test
    void shouldProtectConfiguredAuthEndpoints() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        assertThat(rateLimitingService.isProtected(request)).isTrue();
    }

    @Test
    void shouldRejectRequestsAfterThreshold() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/refresh");

        RateLimitDecision first = rateLimitingService.checkLimit(request, "127.0.0.1");
        RateLimitDecision second = rateLimitingService.checkLimit(request, "127.0.0.1");

        assertThat(first.allowed()).isTrue();
        assertThat(second.allowed()).isFalse();
        assertThat(second.retryAfterSeconds()).isPositive();
    }
}
