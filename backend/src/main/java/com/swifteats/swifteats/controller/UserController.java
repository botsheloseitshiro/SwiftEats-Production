package com.swifteats.swifteats.controller;

import com.swifteats.swifteats.dto.user.SavedAddressDTO;
import com.swifteats.swifteats.dto.user.SavedAddressRequest;
import com.swifteats.swifteats.dto.user.ChangePasswordRequest;
import com.swifteats.swifteats.dto.user.SavedCardDTO;
import com.swifteats.swifteats.dto.user.SavedCardRequest;
import com.swifteats.swifteats.dto.user.UpdateProfileRequest;
import com.swifteats.swifteats.dto.user.UserProfileDTO;
import com.swifteats.swifteats.dto.auth.MessageResponse;
import com.swifteats.swifteats.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/users", "/api/v1/users"})
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileDTO> getProfile() {
        UserProfileDTO profile = userService.getCurrentProfile();
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileDTO> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UserProfileDTO updatedProfile = userService.updateProfile(request);
        return ResponseEntity.ok(updatedProfile);
    }

    @PutMapping("/profile/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.ok(new MessageResponse("Password updated successfully."));
    }

    @GetMapping("/profile/addresses")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SavedAddressDTO>> getSavedAddresses() {
        return ResponseEntity.ok(userService.getSavedAddresses());
    }

    @GetMapping("/profile/cards")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SavedCardDTO>> getSavedCards() {
        return ResponseEntity.ok(userService.getSavedCards());
    }

    @PostMapping("/profile/addresses")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SavedAddressDTO> createSavedAddress(@Valid @RequestBody SavedAddressRequest request) {
        return ResponseEntity.ok(userService.createSavedAddress(request));
    }

    @PostMapping("/profile/cards")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SavedCardDTO> createSavedCard(@Valid @RequestBody SavedCardRequest request) {
        return ResponseEntity.ok(userService.createSavedCard(request));
    }

    @PutMapping("/profile/addresses/{addressId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SavedAddressDTO> updateSavedAddress(
            @PathVariable Long addressId,
            @Valid @RequestBody SavedAddressRequest request) {
        return ResponseEntity.ok(userService.updateSavedAddress(addressId, request));
    }

    @PutMapping("/profile/cards/{cardId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SavedCardDTO> updateSavedCard(
            @PathVariable Long cardId,
            @Valid @RequestBody SavedCardRequest request) {
        return ResponseEntity.ok(userService.updateSavedCard(cardId, request));
    }

    @PutMapping("/profile/addresses/{addressId}/default")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SavedAddressDTO> setDefaultAddress(@PathVariable Long addressId) {
        return ResponseEntity.ok(userService.setDefaultAddress(addressId));
    }

    @PutMapping("/profile/cards/{cardId}/default")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SavedCardDTO> setDefaultCard(@PathVariable Long cardId) {
        return ResponseEntity.ok(userService.setDefaultCard(cardId));
    }

    @DeleteMapping("/profile/addresses/{addressId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteSavedAddress(@PathVariable Long addressId) {
        userService.deleteSavedAddress(addressId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/profile/cards/{cardId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteSavedCard(@PathVariable Long cardId) {
        userService.deleteSavedCard(cardId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deactivateCurrentUser() {
        userService.deactivateCurrentUser();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserProfileDTO> getUserById(@PathVariable Long id) {
        UserProfileDTO profile = userService.getProfile(id);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserProfileDTO> updateUserProfile(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileDTO updatedProfile = userService.updateUserProfile(id, request);
        return ResponseEntity.ok(updatedProfile);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.noContent().build();
    }
}
