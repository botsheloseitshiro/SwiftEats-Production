package com.swifteats.swifteats.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordValidator.class)
@Documented
public @interface ValidPassword {
    String message() default "Password must be 6-100 characters and include at least 1 number and 1 special character (!@#$%^&*)";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
