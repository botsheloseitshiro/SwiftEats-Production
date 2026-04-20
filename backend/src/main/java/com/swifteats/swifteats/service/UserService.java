package com.swifteats.swifteats.service;

import com.swifteats.swifteats.dto.RestaurantDTO;
import com.swifteats.swifteats.dto.user.SavedAddressDTO;
import com.swifteats.swifteats.dto.user.SavedAddressRequest;
import com.swifteats.swifteats.dto.user.ChangePasswordRequest;
import com.swifteats.swifteats.dto.user.SavedCardDTO;
import com.swifteats.swifteats.dto.user.SavedCardRequest;
import com.swifteats.swifteats.dto.user.UpdateProfileRequest;
import com.swifteats.swifteats.dto.user.UserProfileDTO;
import com.swifteats.swifteats.model.CardType;
import com.swifteats.swifteats.exception.ResourceNotFoundException;
import com.swifteats.swifteats.model.SavedAddress;
import com.swifteats.swifteats.model.SavedCard;
import com.swifteats.swifteats.model.User;
import com.swifteats.swifteats.repository.SavedAddressRepository;
import com.swifteats.swifteats.repository.SavedCardRepository;
import com.swifteats.swifteats.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SavedAddressRepository savedAddressRepository;
    private final SavedCardRepository savedCardRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    private User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("No authenticated user found");
        }

        String email = authentication.getName();  // Principal name is the email
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional(readOnly = true)
    public UserProfileDTO getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        return mapToProfileDTO(user);
    }

    @Transactional(readOnly = true)
    public UserProfileDTO getCurrentProfile() {
        User user = getCurrentAuthenticatedUser();
        return mapToProfileDTO(user);
    }

    @Transactional
    public UserProfileDTO updateProfile(UpdateProfileRequest request) {
        User user = getCurrentAuthenticatedUser();

        // Update fields
        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setAddress(request.getAddress());

        // Save to database
        User updatedUser = userRepository.save(user);
        log.info("User profile updated: {}", user.getEmail());
        auditLogService.log("PROFILE_UPDATED", user.getEmail(), "User", String.valueOf(user.getId()), java.util.Map.of());

        return mapToProfileDTO(updatedUser);
    }

    @Transactional
    public UserProfileDTO updateUserProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setAddress(request.getAddress());

        User updatedUser = userRepository.save(user);
        log.info("User profile updated: {}", user.getEmail());
        auditLogService.log("PROFILE_UPDATED_BY_ADMIN", currentActor(), "User", String.valueOf(user.getId()), java.util.Map.of());

        return mapToProfileDTO(updatedUser);
    }

    @Transactional(readOnly = true)
    public List<SavedAddressDTO> getSavedAddresses() {
        User user = getCurrentAuthenticatedUser();
        return savedAddressRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(user.getId())
                .stream()
                .map(SavedAddressDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SavedCardDTO> getSavedCards() {
        User user = getCurrentAuthenticatedUser();
        return savedCardRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(user.getId()).stream()
                .map(SavedCardDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public SavedAddressDTO createSavedAddress(SavedAddressRequest request) {
        User user = getCurrentAuthenticatedUser();
        SavedAddress address = SavedAddress.builder()
                .label(request.getLabel().trim())
                .addressLine(request.getAddressLine().trim())
                .isDefault(request.isDefault())
                .user(user)
                .build();

        if (request.isDefault()) {
            clearDefaultAddress(user);
            user.setAddress(address.getAddressLine());
        } else if (user.getAddress() == null || user.getAddress().isBlank()) {
            address.setDefault(true);
            user.setAddress(address.getAddressLine());
        }

        SavedAddress savedAddress = savedAddressRepository.save(address);
        userRepository.save(user);
        auditLogService.log("SAVED_ADDRESS_CREATED", user.getEmail(), "SavedAddress", String.valueOf(savedAddress.getId()),
                java.util.Map.of("default", savedAddress.isDefault()));
        return SavedAddressDTO.fromEntity(savedAddress);
    }

    @Transactional
    public SavedAddressDTO updateSavedAddress(Long addressId, SavedAddressRequest request) {
        User user = getCurrentAuthenticatedUser();
        SavedAddress address = savedAddressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Saved address not found"));

        address.setLabel(request.getLabel().trim());
        address.setAddressLine(request.getAddressLine().trim());
        if (request.isDefault()) {
            clearDefaultAddress(user);
            address.setDefault(true);
            user.setAddress(address.getAddressLine());
        } else if (address.isDefault()) {
            user.setAddress(address.getAddressLine());
        }

        SavedAddress updated = savedAddressRepository.save(address);
        userRepository.save(user);
        auditLogService.log("SAVED_ADDRESS_UPDATED", user.getEmail(), "SavedAddress", String.valueOf(updated.getId()),
                java.util.Map.of("default", updated.isDefault()));
        return SavedAddressDTO.fromEntity(updated);
    }

    @Transactional
    public SavedAddressDTO setDefaultAddress(Long addressId) {
        User user = getCurrentAuthenticatedUser();
        SavedAddress address = savedAddressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Saved address not found"));

        clearDefaultAddress(user);
        address.setDefault(true);
        user.setAddress(address.getAddressLine());

        savedAddressRepository.save(address);
        userRepository.save(user);
        auditLogService.log("SAVED_ADDRESS_DEFAULT_SET", user.getEmail(), "SavedAddress", String.valueOf(address.getId()),
                java.util.Map.of());
        return SavedAddressDTO.fromEntity(address);
    }

    @Transactional
    public void deleteSavedAddress(Long addressId) {
        User user = getCurrentAuthenticatedUser();
        SavedAddress address = savedAddressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Saved address not found"));

        boolean wasDefault = address.isDefault();
        savedAddressRepository.delete(address);

        if (wasDefault) {
            List<SavedAddress> remaining = savedAddressRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(user.getId());
            if (!remaining.isEmpty()) {
                SavedAddress nextDefault = remaining.get(0);
                nextDefault.setDefault(true);
                user.setAddress(nextDefault.getAddressLine());
                savedAddressRepository.save(nextDefault);
            } else {
                user.setAddress(null);
            }
            userRepository.save(user);
        }

        auditLogService.log("SAVED_ADDRESS_DELETED", user.getEmail(), "SavedAddress", String.valueOf(addressId), java.util.Map.of());
    }

    @Transactional
    public SavedCardDTO createSavedCard(SavedCardRequest request) {
        User user = getCurrentAuthenticatedUser();
        SavedCard card = SavedCard.builder()
                .user(user)
                .cardHolderName(request.getCardHolderName().trim())
                .cardType(resolveCardType(request.getCardNumber()))
                .lastFourDigits(lastFour(request.getCardNumber()))
                .expiryMonth(request.getExpiryMonth())
                .expiryYear(request.getExpiryYear())
                .isDefault(request.isDefault())
                .build();

        if (request.isDefault() || savedCardRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(user.getId()).isEmpty()) {
            clearDefaultCard(user);
            card.setDefault(true);
        }

        SavedCard saved = savedCardRepository.save(card);
        auditLogService.log("SAVED_CARD_CREATED", user.getEmail(), "SavedCard", String.valueOf(saved.getId()), java.util.Map.of());
        return SavedCardDTO.fromEntity(saved);
    }

    @Transactional
    public SavedCardDTO updateSavedCard(Long cardId, SavedCardRequest request) {
        User user = getCurrentAuthenticatedUser();
        SavedCard card = savedCardRepository.findByIdAndUserId(cardId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Saved card not found"));

        card.setCardHolderName(request.getCardHolderName().trim());
        card.setCardType(resolveCardType(request.getCardNumber()));
        card.setLastFourDigits(lastFour(request.getCardNumber()));
        card.setExpiryMonth(request.getExpiryMonth());
        card.setExpiryYear(request.getExpiryYear());

        if (request.isDefault()) {
            clearDefaultCard(user);
            card.setDefault(true);
        }

        SavedCard updated = savedCardRepository.save(card);
        auditLogService.log("SAVED_CARD_UPDATED", user.getEmail(), "SavedCard", String.valueOf(updated.getId()), java.util.Map.of());
        return SavedCardDTO.fromEntity(updated);
    }

    @Transactional
    public SavedCardDTO setDefaultCard(Long cardId) {
        User user = getCurrentAuthenticatedUser();
        SavedCard card = savedCardRepository.findByIdAndUserId(cardId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Saved card not found"));
        clearDefaultCard(user);
        card.setDefault(true);
        savedCardRepository.save(card);
        auditLogService.log("SAVED_CARD_DEFAULT_SET", user.getEmail(), "SavedCard", String.valueOf(card.getId()), java.util.Map.of());
        return SavedCardDTO.fromEntity(card);
    }

    @Transactional
    public void deleteSavedCard(Long cardId) {
        User user = getCurrentAuthenticatedUser();
        SavedCard card = savedCardRepository.findByIdAndUserId(cardId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Saved card not found"));
        boolean wasDefault = card.isDefault();
        savedCardRepository.delete(card);

        if (wasDefault) {
            savedCardRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(user.getId()).stream().findFirst()
                    .ifPresent(next -> {
                        next.setDefault(true);
                        savedCardRepository.save(next);
                    });
        }

        auditLogService.log("SAVED_CARD_DELETED", user.getEmail(), "SavedCard", String.valueOf(cardId), java.util.Map.of());
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentAuthenticatedUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirm password do not match.");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password must be different from the current password.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditLogService.log("PASSWORD_CHANGED", user.getEmail(), "User", String.valueOf(user.getId()), java.util.Map.of());
    }

    @Transactional
    public void deactivateCurrentUser() {
        User user = getCurrentAuthenticatedUser();
        user.setActive(false);
        userRepository.save(user);
        auditLogService.log("USER_DEACTIVATED_SELF", user.getEmail(), "User", String.valueOf(user.getId()), java.util.Map.of());
    }

    @Transactional
    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        user.setActive(false);
        userRepository.save(user);
        auditLogService.log("USER_DEACTIVATED_BY_ADMIN", currentActor(), "User", String.valueOf(userId), java.util.Map.of());
    }

    private UserProfileDTO mapToProfileDTO(User user) {
        // Convert managed restaurants to DTOs if user is a restaurant admin
        List<RestaurantDTO> managedRestaurantDTOs = List.of();
        try {
            if (user.getManagedRestaurants() != null && !user.getManagedRestaurants().isEmpty()) {
                managedRestaurantDTOs = user.getManagedRestaurants().stream()
                        .map(RestaurantDTO::fromEntity)
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.warn("Failed to load managed restaurants for user {}: {}", user.getEmail(), e.getMessage());
            // Return empty list if lazy loading fails
            managedRestaurantDTOs = List.of();
        }

        return UserProfileDTO.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .role(user.getRole().toString())
                .active(user.isActive())
                .managedRestaurants(managedRestaurantDTOs)
                .savedAddresses(savedAddressRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(user.getId()).stream()
                        .map(SavedAddressDTO::fromEntity)
                        .collect(Collectors.toList()))
                .savedCards(savedCardRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(user.getId()).stream()
                        .map(SavedCardDTO::fromEntity)
                        .collect(Collectors.toList()))
                .build();
    }

    private void clearDefaultAddress(User user) {
        savedAddressRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(user.getId())
                .forEach(existing -> existing.setDefault(false));
    }

    private void clearDefaultCard(User user) {
        savedCardRepository.findByUserIdOrderByIsDefaultDescCreatedAtAsc(user.getId())
                .forEach(existing -> existing.setDefault(false));
    }

    public CardType resolveCardType(String cardNumber) {
        String sanitized = cardNumber == null ? "" : cardNumber.replaceAll("\\s+", "");
        if (sanitized.startsWith("4")) {
            return CardType.VISA;
        }
        if (sanitized.startsWith("5")) {
            return CardType.MASTERCARD;
        }
        throw new IllegalArgumentException("Only Visa and Mastercard are supported.");
    }

    public String lastFour(String cardNumber) {
        String sanitized = cardNumber == null ? "" : cardNumber.replaceAll("\\s+", "");
        if (sanitized.length() < 4) {
            throw new IllegalArgumentException("Card number is invalid.");
        }
        return sanitized.substring(sanitized.length() - 4).toUpperCase(Locale.ROOT);
    }

    private String currentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : "system";
    }
}
