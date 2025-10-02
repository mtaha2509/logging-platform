package com.example.backend.controllers;

import com.example.backend.dtos.*;
import com.example.backend.services.AuthService;
import com.example.backend.services.LogService;
import com.example.backend.validation.ValidPageable;
import com.example.backend.validation.ParameterCountValidator;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/logs")
@RequiredArgsConstructor
public class LogsController {
    private static final Logger logger = LogManager.getLogger(LogsController.class);
    private final LogService logService;
    private final AuthService authService;

    @GetMapping
    public Page<LogDTO> searchLogs(
            @RequestParam(required = false) List<Long> appIds,
            @RequestParam(required = false) List<String> levels,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String messageContains,
            @ValidPageable Pageable pageable,
            Authentication authentication,
            HttpServletRequest httpRequest) {

        logger.info("Searching logs with filters - appIds: {}, levels: {}, from: {}, to: {}, messageContains: {}", 
                appIds, levels, from, to, messageContains);
        
        // Validate that only expected parameters are provided
        ParameterCountValidator.validateGetRequest(httpRequest, 
                "appIds", "levels", "from", "to", "messageContains", "page", "size", "sort");

        UserInfo currentUser = authService.getCurrentUser(authentication)
                .orElseThrow(() -> new AccessDeniedException("User not authenticated"));

        return logService.searchLogs(currentUser.getId(), appIds, levels, messageContains, from, to, pageable);
    }

    @GetMapping("/analysis")
    public ResponseEntity<?> getLogAnalysis(
            @RequestParam String view,
            @RequestParam String period,
            @RequestParam(required = false) List<Long> appIds,
            Authentication authentication,
            HttpServletRequest httpRequest) {

        // Validate that only expected parameters are provided
        ParameterCountValidator.validateGetRequest(httpRequest, "view", "period", "appIds");

        UserInfo currentUser = authService.getCurrentUser(authentication)
                .orElseThrow(() -> new AccessDeniedException("User not authenticated"));

        if ("trends".equalsIgnoreCase(view)) {
            List<TrendBucketDTO> trends = logService.getLogTrends(currentUser.getId(), period, appIds);
            return ResponseEntity.ok(trends);
        } else if ("summary".equalsIgnoreCase(view)) {
            List<LevelCountDTO> summary = logService.getLogSummary(currentUser.getId(), period, appIds);
            return ResponseEntity.ok(summary);
        } else {
            // Return a 400 Bad Request if the view type is invalid.
            // Your GlobalExceptionHandler will likely handle this exception.
            throw new IllegalArgumentException("Invalid 'view' parameter. Must be 'trends' or 'summary'.");
        }
    }
}
