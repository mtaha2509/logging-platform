package com.example.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Custom validation annotation for Pageable parameters.
 * Validates that page and size parameters are valid integers and within acceptable ranges.
 */
@Target({ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PageableValidator.class)
@Documented
public @interface ValidPageable {
    String message() default "Invalid pagination parameters";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    
    /**
     * Maximum allowed page number (0-based)
     */
    int maxPage() default 1000;
    
    /**
     * Maximum allowed page size
     */
    int maxSize() default 100;
    
    /**
     * Minimum allowed page size
     */
    int minSize() default 1;
}
