package com.example.backend.services;

import com.example.backend.controllers.AlertController;
import com.example.backend.controllers.ApplicationController;
import com.example.backend.dtos.CreateAlertRequest;
import com.example.backend.dtos.UpdateAlertRequest;
import com.example.backend.entities.*;
import com.example.backend.repositories.*;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class AlertService {
    private final AlertRepository alertRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private static final Logger logger = LogManager.getLogger(AlertService.class);

    public List<Alert> getAlertsForUser(Long userId) {
        return alertRepository.findByCreatedById(userId);
    }

    @PreAuthorize("@authz.isAdmin()")
    public Page<Alert> getAllAlerts(Pageable pageable) {
        // Use findAll to respect the sort parameter from Pageable
        // If no sort specified, default to updatedAt desc is handled by frontend
        return alertRepository.findAll(pageable);
    }


    @Transactional
    @PreAuthorize("@authz.isAdmin()")
    public Alert createAlert(CreateAlertRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found with ID: " + userId));

        Application app = applicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new NoSuchElementException("Application not found with ID: " + request.getApplicationId()));

        // Check for duplicate alert
        if (alertRepository.findByApplicationAndLevelAndCountAndTimeWindow(
                app, request.getSeverityLevel(), request.getCount(), request.getTimeWindow()).isPresent()) {
            throw new IllegalArgumentException("An alert with the same configuration already exists for this application");
        }

        Alert alert = new Alert();
        alert.setCount(request.getCount());
        alert.setTimeWindow(request.getTimeWindow());
        alert.setCreatedBy(user);
        alert.setApplication(app);
        alert.setLevel(request.getSeverityLevel());
        alert.setUpdatedAt(Timestamp.from(Instant.now()));

        return alertRepository.save(alert);
    }

    @Transactional
    @PreAuthorize("@authz.isAdmin()")
    public Alert updateAlert(Long alertId, UpdateAlertRequest request, Long userId) {
        // Check if alert exists
        Alert existingAlert = alertRepository.findById(alertId)
                .orElseThrow(() -> new NoSuchElementException("Alert not found with ID: " + alertId));

        // Verify user exists (for validation purposes)
        userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found with ID: " + userId));

        // Verify application exists
        Application app = applicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new NoSuchElementException("Application not found with ID: " + request.getApplicationId()));

        // Check for duplicate alert (excluding current alert)
        if (alertRepository.findByApplicationAndLevelAndCountAndTimeWindowAndIdNot(
                app, request.getSeverityLevel(), request.getCount(), request.getTimeWindow(), alertId).isPresent()) {
            throw new IllegalArgumentException("An alert with the same configuration already exists for this application");
        }

        // Update alert fields
        existingAlert.setCount(request.getCount());
        existingAlert.setTimeWindow(request.getTimeWindow());
        existingAlert.setLevel(request.getSeverityLevel());
        existingAlert.setApplication(app);
        existingAlert.setUpdatedAt(Timestamp.from(Instant.now()));
        
        // Update isActive if provided
        if (request.getIsActive() != null) {
            existingAlert.setIsActive(request.getIsActive());
            logger.info("Alert ID {} status changed to: {}", alertId, 
                       request.getIsActive() ? "ACTIVE" : "INACTIVE");
        }
        // Note: We don't update createdBy as it should remain the original creator

        return alertRepository.save(existingAlert);
    }
}