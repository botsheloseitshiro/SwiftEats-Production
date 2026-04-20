package com.swifteats.swifteats.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PhoneNumberValidator.class)
@Documented
public @interface ValidPhoneNumber {
    String message() default "Phone number must be 10-15 digits (spaces, hyphens, and parentheses allowed)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
