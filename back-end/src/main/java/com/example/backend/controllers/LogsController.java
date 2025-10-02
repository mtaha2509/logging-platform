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
import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/logs")
@RequiredArgsConstructor
public class LogsController {
    private static final Logger logger = LogManager.getLogger(LogsController.class);
    private final LogService logService;
    private final AuthService authService;

    /**
     * Search logs with multiple filters (all filters use AND logic, except within same filter which uses OR).
     * 
     * Query parameter semantics:
     * - appIds: Comma-separated for OR → ?appIds=4,20 means (app 4 OR app 20)
     * - levels: Comma-separated for OR → ?levels=ERROR,WARNING means (ERROR OR WARNING)
     * - Multiple different filters combined with AND
     * 
     * Example: ?appIds=4,20&levels=ERROR,WARNING&from=2025-10-01T00:00:00
     * Semantic: (app 4 OR app 20) AND (ERROR OR WARNING) AND (after Oct 1)
     * 
     * @param appIds Filter by application IDs (OR logic if multiple)
     * @param levels Filter by log levels (OR logic if multiple)
     * @param from Filter logs after this timestamp (UTC)
     * @param to Filter logs before this timestamp (UTC)
     * @param messageContains Filter by message content (partial match)
     * @param pageable Pagination and sorting parameters
     */
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

        // Frontend sends UTC timestamps without 'Z' suffix, so we receive them as LocalDateTime
        // We need to treat these LocalDateTime values as UTC and convert to system timezone for DB queries
        LocalDateTime fromUtc = from;
        LocalDateTime toUtc = to;
        
        logger.info("Searching logs with filters - appIds: {}, levels: {}, from (UTC): {}, to (UTC): {}, messageContains: {}", 
                appIds, levels, fromUtc, toUtc, messageContains);
        
        // Validate that only expected parameters are provided
        ParameterCountValidator.validateGetRequest(httpRequest, 
                "appIds", "levels", "from", "to", "messageContains", "page", "size", "sort");

        UserInfo currentUser = authService.getCurrentUser(authentication)
                .orElseThrow(() -> new AccessDeniedException("User not authenticated"));

        return logService.searchLogs(currentUser.getId(), appIds, levels, messageContains, fromUtc, toUtc, pageable);
    }

    /**
     * Get log analysis (trends or summary) for specified applications and time period.
     * 
     * Query parameter semantics:
     * - appIds: Comma-separated for OR → ?appIds=4,20 means (app 4 OR app 20)
     * - If admin and appIds not provided: analyzes ALL applications
     * - If regular user: must provide appIds (filtered to only assigned apps)
     * 
     * @param view Either "trends" (time-series data) or "summary" (aggregated counts)
     * @param period Time range: last_hour, last_24_hours, last_7_days, last_30_days
     * @param appIds Filter by application IDs (OR logic if multiple)
     */
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
