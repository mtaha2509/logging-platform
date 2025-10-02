package com.example.backend.dtos;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * Request to assign multiple users to multiple applications in bulk.
 * Creates permissions with cartesian product logic: each user gets access to each app.
 * Example: userIds=[1,2] + appIds=[10,20] = 4 permissions (1→10, 1→20, 2→10, 2→20)
 */
@Data
public class AssignPermissionRequest {
    @NotEmpty(message = "User IDs list cannot be empty")
    private List<Long> userIds;  // Users to grant access

    @NotEmpty(message = "Application IDs list cannot be empty")
    private List<Long> appIds;  // Applications to grant access to
}