package com.swifteats.swifteats.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PhoneNumberValidator implements ConstraintValidator<ValidPhoneNumber, String> {

    @Override
    public void initialize(ValidPhoneNumber constraintAnnotation) {
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // If null or empty, it's acceptable (field is optional)
        if (value == null || value.trim().isEmpty()) {
            return true;
        }

        // Remove common phone formatting characters
        String digitsOnly = value.replaceAll("[\\s\\-\\(\\)\\+]", "");

        // Check that it contains only digits after removing formatting
        if (!digitsOnly.matches("\\d+")) {
            return false;
        }

        // Check length: 10-15 digits
        return digitsOnly.length() >= 10 && digitsOnly.length() <= 15;
    }
}
