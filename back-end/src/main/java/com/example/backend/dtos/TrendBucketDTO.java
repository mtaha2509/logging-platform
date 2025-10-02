package com.example.backend.dtos;

import lombok.Data;

import java.sql.Timestamp;
import java.util.List;

@Data
public class TrendBucketDTO {
    private Timestamp time;
    private Long totalCount = 0L;
    private List<LevelCountDTO> levelCounts;
}

