package com.example.backend.dtos;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BulkRevokeRequest {
    @NotEmpty(message = "User IDs list cannot be empty")
    private List<Long> userIds;
    
    @NotEmpty(message = "Application IDs list cannot be empty")
    private List<Long> appIds;
}