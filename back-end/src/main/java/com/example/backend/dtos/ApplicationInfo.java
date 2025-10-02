package com.example.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationInfo {
    private Long id;
    private String name;
    private String description;
    private Timestamp updatedAt;
    private Boolean isActive;
}
