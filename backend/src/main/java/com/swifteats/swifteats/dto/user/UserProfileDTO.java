package com.swifteats.swifteats.dto.user;

import com.swifteats.swifteats.dto.RestaurantDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {

    /** User's database ID */
    private Long id;

    /** User's full name */
    private String fullName;

    /** User's email address */
    private String email;

    /** User's phone number */
    private String phoneNumber;

    /** User's delivery address */
    private String address;

    /** User's role (CUSTOMER, ADMIN, DRIVER, RESTAURANT_ADMIN) */
    private String role;

    /** Whether the account is active */
    private boolean active;

    /** Restaurants managed by this user (only for RESTAURANT_ADMIN) */
    @Builder.Default
    private List<RestaurantDTO> managedRestaurants = new ArrayList<>();

    @Builder.Default
    private List<SavedAddressDTO> savedAddresses = new ArrayList<>();

    @Builder.Default
    private List<SavedCardDTO> savedCards = new ArrayList<>();
}
