package com.example.backend.services;

import com.example.backend.entities.*;
import com.example.backend.repositories.AlertRepository;
import com.example.backend.repositories.LogsRepository;
import com.example.backend.repositories.NotificationRepository;
import com.example.backend.repositories.PermissionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertDetectionService {

    // --- Injected Services (No Repositories needed here directly) ---
    private final AlertRepository alertRepository; // To get the list of alerts
    private final AlertEvaluator alertEvaluator;
    private final NotificationService notificationCreationService;

    private final Map<Long, Instant> firingAlerts = new ConcurrentHashMap<>();

    @Scheduled(fixedRate = 60000)
    public void evaluateAlerts() {
        log.info("Starting alert evaluation job...");
        List<Alert> allAlerts = alertRepository.findAll();
        log.info("Found {} alerts to evaluate", allAlerts.size());
        
        for (Alert alert : allAlerts) {
            // Skip inactive alerts
            if (alert.getIsActive() != null && !alert.getIsActive()) {
                log.debug("Skipping inactive alert ID {}", alert.getId());
                continue;
            }
            
            // Skip alerts for inactive applications
            if (alert.getApplication().getIsActive() != null && !alert.getApplication().getIsActive()) {
                log.debug("Skipping alert ID {} for inactive application '{}'", 
                        alert.getId(), alert.getApplication().getName());
                continue;
            }
            
            log.debug("Evaluating alert ID {} for application '{}' with threshold {} and level '{}'", 
                    alert.getId(), alert.getApplication().getName(), alert.getCount(), alert.getLevel());
            evaluateSingleAlert(alert);
        }
        log.info("Finished alert evaluation job.");
    }

    private void evaluateSingleAlert(Alert alert) {
        Instant windowStart = Instant.now().minus(alert.getTimeWindow());
        Timestamp startTime = Timestamp.from(windowStart);

        log.debug("Alert ID {}: Checking logs from {} to now for level '{}' in application '{}'", 
                alert.getId(), startTime, alert.getLevel(), alert.getApplication().getName());

        // Step 1: Call the AlertEvaluator service (transactional read)
        long eventCount = alertEvaluator.countEventsInWindow(alert, startTime);

        log.debug("Alert ID {}: Found {} events (threshold: {})", alert.getId(), eventCount, alert.getCount());

        // Step 2: Check the alert's state
        boolean isConditionMet = eventCount >= alert.getCount();
        boolean isCurrentlyFiring = firingAlerts.containsKey(alert.getId());

        if (isConditionMet && !isCurrentlyFiring) {
            log.warn("ALERT TRIGGERED: Alert ID {}. Count of {} exceeded threshold of {}.",
                    alert.getId(), eventCount, alert.getCount());

            // Step 3: Call the NotificationCreationService (transactional write)
            try {
                notificationCreationService.createNotificationsForTriggeredAlert(alert, eventCount);
                firingAlerts.put(alert.getId(), Instant.now());
            } catch (Exception e) {
                log.error("Failed to create notifications for alert ID {}: {}", alert.getId(), e.getMessage(), e);
            }

        } else if (!isConditionMet && isCurrentlyFiring) {
            log.info("ALERT RESOLVED: Alert ID {}. Count of {} is now below threshold.",
                    alert.getId(), eventCount);
            firingAlerts.remove(alert.getId());
        } else {
            log.debug("Alert ID {}: No action needed. Condition met: {}, Currently firing: {}", 
                    alert.getId(), isConditionMet, isCurrentlyFiring);
        }
    }
}