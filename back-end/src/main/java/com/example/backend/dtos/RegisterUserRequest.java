package com.example.backend.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.sql.Timestamp;

@Data
public class RegisterUserRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
}
