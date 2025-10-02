package com.example.backend.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateApplicationRequest {
    @NotBlank(message = "Application name is required")
    @Size(min = 1, max = 100, message = "Application name must be between 1 and 100 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}