package com.swifteats.swifteats.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {

    @Override
    public void initialize(ValidPassword constraintAnnotation) {
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // If null or empty, other validators (like @NotBlank) will handle it
        if (value == null || value.isEmpty()) {
            return true;
        }

        // Check length: 6-100 characters
        if (value.length() < 6 || value.length() > 100) {
            return false;
        }

        // Check for at least one number
        boolean hasNumber = value.matches(".*\\d.*");

        // Check for at least one special character
        boolean hasSpecialChar = value.matches(".*[!@#$%^&*\\-_=+].*");

        return hasNumber && hasSpecialChar;
    }
}
