package com.swifteats.swifteats.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor  // Lombok: auto-generates constructor for final fields (dependency injection)
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    // Injected via constructor (RequiredArgsConstructor handles this)
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    /**
     * doFilterInternal — Core filter logic executed for every HTTP request.
     *
     * @param request     The incoming HTTP request
     * @param response    The HTTP response being built
     * @param filterChain The remaining filters to run after this one
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // Step 1: Extract the JWT token from the Authorization header
            String jwt = extractTokenFromRequest(request);

            // Step 2: If a token exists and it's valid, authenticate the user
            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {

                // Step 3: Decode the token to get the username (email)
                String username = jwtTokenProvider.getUsernameFromToken(jwt);

                // Step 4: Load the full UserDetails (roles, password hash, etc.) from DB
                // This hits the database to get the current user state
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // Step 5: Create a Spring Security authentication token
                // UsernamePasswordAuthenticationToken(principal, credentials, authorities)
                //   - principal:   the UserDetails object (who the user is)
                //   - credentials: null (we don't need password here — token already verified)
                //   - authorities: the user's roles (ROLE_CUSTOMER, ROLE_ADMIN, etc.)
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                // Attach request details (IP address, session ID) for audit/logging
                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // Step 6: Store the authentication in the SecurityContext
                // This tells Spring Security: "This request is authenticated as <username>"
                // All subsequent code in this request can call:
                //   SecurityContextHolder.getContext().getAuthentication()
                // to get the current user.
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("Set authentication for user: {}", username);
            }
        } catch (Exception ex) {
            // If anything goes wrong, we simply don't authenticate (request proceeds as anonymous)
            // The endpoint security rules will then decide if access is allowed
            log.error("Could not set user authentication in security context: {}", ex.getMessage());
        }

        // Step 7: Continue the filter chain (next filter or the actual controller)
        filterChain.doFilter(request, response);
    }

    /**
     * extractTokenFromRequest — Parses the JWT from the Authorization header.
     *
     * HTTP headers look like:
     *   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGVtYWlsLmNvbSJ9...
     *
     * We strip the "Bearer " prefix (7 characters) to get just the token string.
     *
     * @param request The HTTP request
     * @return The raw JWT string, or null if header is missing/malformed
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        // Check: header exists AND starts with "Bearer "
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);  // remove "Bearer " prefix
        }

        return null;  // no token found
    }
}
