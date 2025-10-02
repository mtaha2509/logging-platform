package com.example.backend.dtos;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class AssignPermissionRequest {
    @NotEmpty(message = "User IDs list cannot be empty")
    private List<Long> userIds;

    @NotEmpty(message = "Application IDs list cannot be empty")
    private List<Long> appIds;
}