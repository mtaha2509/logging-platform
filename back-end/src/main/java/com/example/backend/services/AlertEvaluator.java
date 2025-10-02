package com.example.backend.services;

import com.example.backend.entities.Alert;
import com.example.backend.repositories.LogsRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;

@Service
@RequiredArgsConstructor
public class AlertEvaluator {

    private final LogsRepository logsRepository;

    @Transactional(readOnly = true)
    public long countEventsInWindow(Alert alert, Timestamp startTime) {
        return logsRepository.countByApplicationAndLevelAndTimestampAfter(
                alert.getApplication(),
                alert.getLevel(),
                startTime
        );
    }
}