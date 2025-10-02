package com.example.backend.validation;

import com.example.backend.config.PaginationConfig;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;

/**
 * Validator for Pageable parameters to ensure page and size are valid.
 * Uses centralized pagination configuration from PaginationConfig.
 */
public class PageableValidator implements ConstraintValidator<ValidPageable, Pageable> {

    @Autowired(required = false)
    private PaginationConfig paginationConfig;

    private int maxPage;
    private int maxSize;
    private int minSize;

    @Override
    public void initialize(ValidPageable constraintAnnotation) {
        this.maxPage = constraintAnnotation.maxPage();
        // Use centralized config if available, otherwise use annotation defaults
        this.maxSize = (paginationConfig != null) ? paginationConfig.getMaxPageSize() : constraintAnnotation.maxSize();
        this.minSize = constraintAnnotation.minSize();
    }

    @Override
    public boolean isValid(Pageable pageable, ConstraintValidatorContext context) {
        if (pageable == null) {
            return true; // Let @NotNull handle null validation
        }

        boolean isValid = true;
        
        // Validate page number
        if (pageable.getPageNumber() < 0) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Page number must be non-negative")
                    .addConstraintViolation();
            isValid = false;
        }
        
        if (pageable.getPageNumber() > maxPage) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Page number must not exceed " + maxPage)
                    .addConstraintViolation();
            isValid = false;
        }
        
        // Validate page size
        if (pageable.getPageSize() < minSize) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Page size must be at least " + minSize)
                    .addConstraintViolation();
            isValid = false;
        }
        
        if (pageable.getPageSize() > maxSize) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Page size must not exceed " + maxSize)
                    .addConstraintViolation();
            isValid = false;
        }
        
        return isValid;
    }
}
