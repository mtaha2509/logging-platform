package com.example.backend.controllers;

import com.example.backend.dtos.AlertInfo;
import com.example.backend.dtos.CreateAlertRequest;
import com.example.backend.dtos.UpdateAlertRequest;
import com.example.backend.dtos.UserInfo;
import com.example.backend.entities.Alert;
import com.example.backend.mappers.AlertMapper;
import com.example.backend.services.AlertService;
import com.example.backend.services.AuthService;
import com.example.backend.validation.ValidPageable;
import com.example.backend.validation.ParameterCountValidator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/alerts")
@RequiredArgsConstructor
public class AlertController {
    private static final Logger logger = LogManager.getLogger(AlertController.class);

    private final AlertService alertService;
    private final AuthService authService;
    private final AlertMapper alertMapper;

    @PreAuthorize("@authz.isAdmin()")
    @PostMapping
    public AlertInfo createAlert(@Valid @RequestBody CreateAlertRequest request, Authentication authentication, HttpServletRequest httpRequest) {
        logger.info("Received request to create alert for applicationId={}", request.getApplicationId());
        // Validate that no extra parameters are provided
        ParameterCountValidator.validatePostRequest(httpRequest);

        UserInfo currentUser = authService.getCurrentUser(authentication)
                .orElseThrow(() -> {
                    logger.warn("Unauthenticated user attempted to create an alert");
                    return new AccessDeniedException("User not authenticated");
                });

        Alert alert = alertService.createAlert(request, currentUser.getId());
        logger.info("Admin {} created alert id={} for applicationId={}", currentUser.getId(), alert.getId(), request.getApplicationId());
        return alertMapper.toAlertInfo(alert);
    }

    @PreAuthorize("@authz.isAdmin()")
    @GetMapping
    public Page<AlertInfo> getAlerts(@ValidPageable Pageable pageable, HttpServletRequest httpRequest) {
        logger.info("Received request to list alerts - page={}, size={}, sort={}", 
            pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());
        logger.info("Query string: {}", httpRequest.getQueryString());
        
        // Validate that only page, size, and sort parameters are provided
        ParameterCountValidator.validateGetRequest(httpRequest, "page", "size", "sort");

        Page<Alert> page = alertService.getAllAlerts(pageable);
        logger.info("Returning {} alerts (page {} of {})", page.getNumberOfElements(), page.getNumber(), page.getTotalPages());
        return page.map(alertMapper::toAlertInfo);
    }

    @PreAuthorize("@authz.isAdmin()")
    @PatchMapping("/{id}")
    public AlertInfo updateAlert(@PathVariable Long id, @Valid @RequestBody UpdateAlertRequest request, Authentication authentication, HttpServletRequest httpRequest) {
        logger.info("Received request to update alert id={}", id);
        // Validate that no extra parameters are provided
        ParameterCountValidator.validatePatchRequest(httpRequest);

        UserInfo currentUser = authService.getCurrentUser(authentication)
                .orElseThrow(() -> {
                    logger.warn("Unauthenticated user attempted to update alert id={}", id);
                    return new AccessDeniedException("User not authenticated");
                });

        Alert updated = alertService.updateAlert(id, request, currentUser.getId());
        logger.info("Admin {} updated alert id={}", currentUser.getId(), id);
        return alertMapper.toAlertInfo(updated);
    }
}
