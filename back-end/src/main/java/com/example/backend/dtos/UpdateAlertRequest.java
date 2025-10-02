package com.example.backend.dtos;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.Duration;

@Data
public class UpdateAlertRequest {
    @NotNull(message = "Count is required")
    @Min(value = 1, message = "Count must be at least 1")
    @Max(value = 10000, message = "Count must not exceed 10000")
    private Integer count;
    
    @NotNull(message = "Time window is required")
    private Duration timeWindow;
    
    @NotBlank(message = "Severity level is required")
    @Pattern(regexp = "^(ERROR|WARNING|INFO|DEBUG)$", message = "Severity level must be one of: ERROR, WARN, INFO, DEBUG")
    private String severityLevel;
    
    @NotNull(message = "Application ID is required")
    @Positive(message = "Application ID must be positive")
    private Long applicationId;
    
    private Boolean isActive;
}
