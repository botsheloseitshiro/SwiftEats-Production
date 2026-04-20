package com.swifteats.swifteats.dto.user;

import com.swifteats.swifteats.model.SavedAddress;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedAddressDTO {
    private Long id;
    private String label;
    private String addressLine;
    private boolean isDefault;

    public static SavedAddressDTO fromEntity(SavedAddress address) {
        return SavedAddressDTO.builder()
                .id(address.getId())
                .label(address.getLabel())
                .addressLine(address.getAddressLine())
                .isDefault(address.isDefault())
                .build();
    }
}
