package com.swifteats.swifteats.service;

import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;


    @Override
    @Transactional(readOnly = true)  // Read-only transaction: optimized for SELECT queries
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String normalizedEmail = User.normalizeEmail(email);

        // Fetch user from database (throws exception if not found)
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with email: " + normalizedEmail));

        // Build the Spring Security authority from the user's role.
        // Spring Security expects the "ROLE_" prefix for hasRole() checks.
        // e.g., Role.CUSTOMER → "ROLE_CUSTOMER"
        SimpleGrantedAuthority authority =
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

        // Return a Spring Security User object (not our custom User entity).
        // Spring Security's User class implements UserDetails and carries:
        //   - username (email)
        //   - password (the BCrypt hash from DB — compared during login)
        //   - authorities (roles)
        //   - accountNonExpired, credentialsNonExpired, accountNonLocked (all true here)
        //   - enabled = user.isActive() (deactivated accounts can't log in)
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPassword())       // BCrypt hash — never the raw password
                .authorities(Collections.singletonList(authority))
                .accountExpired(false)
                .credentialsExpired(false)
                .accountLocked(false)
                .disabled(!user.isActive())         // active=false → can't log in
                .build();
    }
}
