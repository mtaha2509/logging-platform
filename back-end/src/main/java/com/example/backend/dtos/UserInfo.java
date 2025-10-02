package com.example.backend.dtos;

import com.example.backend.entities.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInfo {
    private Long id;
    private String email;
    private Role role;
    private List<Long> assignedApplicationIds;
    private Timestamp lastRefreshedAt;
}
