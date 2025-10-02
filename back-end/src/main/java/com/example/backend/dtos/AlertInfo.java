package com.example.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.time.Duration;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlertInfo {
    private Long id;
    private Timestamp updatedAt;
    private Integer count;
    private Duration timeWindow;
    private String level;
    private Boolean isActive;
    private Long createdById;
    private Long applicationId;
    private String applicationName;
}
