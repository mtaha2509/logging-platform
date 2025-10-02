package com.example.backend.dtos;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request to revoke access for multiple users from multiple applications in bulk.
 * Removes permissions with cartesian product logic: each user loses access to each app.
 * Example: userIds=[1,2] + appIds=[10,20] = removes 4 permissions (1→10, 1→20, 2→10, 2→20)
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class BulkRevokeRequest {
    @NotEmpty(message = "User IDs list cannot be empty")
    private List<Long> userIds;  // Users to revoke access from
    
    @NotEmpty(message = "Application IDs list cannot be empty")
    private List<Long> appIds;  // Applications to revoke access to
}