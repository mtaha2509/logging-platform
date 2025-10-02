package com.example.backend.services;

import com.example.backend.dtos.*;
import com.example.backend.entities.Logs;
import com.example.backend.repositories.LogsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import jakarta.persistence.criteria.Predicate;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LogService {
    private final LogsRepository logRepository;
    private final PermissionService permissionService;

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public Page<LogDTO> searchLogs(Long userId, List<Long> appIds, List<String> levels, String message, 
                                   LocalDateTime startTimeUtc, LocalDateTime endTimeUtc, Pageable pageable) {
        
        try {
            log.info("Searching logs - userId: {}, appIds: {}, levels: {}, startTime (UTC): {}, endTime (UTC): {}, page: {}, size: {}, sort: {}", 
                userId, appIds, levels, startTimeUtc, endTimeUtc, pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());
            
            if (userId == null) {
                throw new IllegalArgumentException("User ID cannot be null");
            }
            
            boolean isAdmin = permissionService.isAdmin(userId);
            
            Specification<Logs> spec = (root, query, cb) -> {
                List<Predicate> preds = new ArrayList<>();

                if (!isAdmin) {
                    // For regular users, filter by allowed applications
                    List<Long> allowedAppIds = permissionService.listAssignedApplicationIds(userId);
                    if (allowedAppIds.isEmpty()) {
                        log.warn("User {} has no application permissions", userId);
                        // User has no app permissions, return no results
                        preds.add(cb.disjunction()); // Always false condition
                        return cb.and(preds.toArray(new Predicate[0]));
                    }
                    
                    if (appIds != null && !appIds.isEmpty()) {
                        // Check if user has access to all requested apps
                        List<Long> accessibleAppIds = appIds.stream()
                                .filter(allowedAppIds::contains)
                                .collect(Collectors.toList());
                        
                        if (accessibleAppIds.isEmpty()) {
                            log.warn("User {} does not have access to any of the requested applications {}", userId, appIds);
                            preds.add(cb.disjunction()); // Always false condition
                            return cb.and(preds.toArray(new Predicate[0]));
                        } else {
                            preds.add(root.get("application").get("id").in(accessibleAppIds));
                        }
                    } else {
                        // Filter to only apps user has access to
                        preds.add(root.get("application").get("id").in(allowedAppIds));
                    }
                } else {
                    // For admin users, allow access to all applications
                    if (appIds != null && !appIds.isEmpty()) {
                        preds.add(root.get("application").get("id").in(appIds));
                    }
                    // If appIds is null or empty, admin can see logs from all applications (no filtering)
                }
            if (levels != null && !levels.isEmpty()) {
                preds.add(root.get("level").in(levels));
            }
            if (startTimeUtc != null) {
                // Frontend sends UTC timestamps as LocalDateTime (without timezone info)
                // We need to convert UTC to Timestamp for database comparison
                // Since Hibernate is configured with time_zone: UTC, it will handle the conversion
                Instant startInstant = startTimeUtc.toInstant(ZoneOffset.UTC);
                Timestamp startTimestamp = Timestamp.from(startInstant);
                log.debug("Converted start time - UTC LocalDateTime: {} -> Instant: {} -> Timestamp: {}", 
                    startTimeUtc, startInstant, startTimestamp);
                preds.add(cb.greaterThanOrEqualTo(root.get("timestamp"), startTimestamp));
            }
            if (endTimeUtc != null) {
                // Same conversion for end time
                Instant endInstant = endTimeUtc.toInstant(ZoneOffset.UTC);
                Timestamp endTimestamp = Timestamp.from(endInstant);
                log.debug("Converted end time - UTC LocalDateTime: {} -> Instant: {} -> Timestamp: {}", 
                    endTimeUtc, endInstant, endTimestamp);
                preds.add(cb.lessThanOrEqualTo(root.get("timestamp"), endTimestamp));
            }
            if (message != null && !message.isBlank()) {
                    preds.add(cb.like(root.get("message"), "%" + message + "%"));
            }

                // Don't add orderBy here - let Pageable handle sorting
                // This allows frontend to control sort direction
                return cb.and(preds.toArray(new Predicate[0]));
            };
            
            Page<Logs> page = logRepository.findAll(spec, pageable);
            
            log.debug("Found {} logs for user {}", page.getTotalElements(), userId);
            
            return page.map(log -> {
                LogDTO dto = new LogDTO();
                dto.setId(log.getId());
                dto.setTimestamp(log.getTimestamp());
                dto.setLevel(log.getLevel());
                dto.setMessage(log.getMessage());
                if (log.getApplication() != null) {
                    dto.setApplicationId(log.getApplication().getId());
                    dto.setApplicationName(log.getApplication().getName());
                }
                return dto;
            });
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid argument in searchLogs: {}", e.getMessage());
            throw e; // Re-throw to be handled by GlobalExceptionHandler
        } catch (Exception e) {
            log.error("Unexpected error in searchLogs for userId {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to search logs", e);
        }
    }


    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public List<TrendBucketDTO> getLogTrends(Long userId, String period, List<Long> appIds) {
        try {
            log.debug("Getting log trends for userId: {}, period: {}, appIds: {}", userId, period, appIds);

            if (userId == null) {
                throw new IllegalArgumentException("User ID cannot be null");
            }

            if (period == null || period.trim().isEmpty()) {
                throw new IllegalArgumentException("Period cannot be null or empty");
            }

            boolean isAdmin = permissionService.isAdmin(userId);

            // Validation for non-admin users: appIds must be provided and non-empty
            if (!isAdmin) {
                if (appIds == null || appIds.isEmpty()) {
                    throw new IllegalArgumentException("appIds cannot be null or empty for non-admin users");
                }
                // Validate each provided appId is viewable by the user
                List<Long> invalid = appIds.stream()
                        .filter(id -> !permissionService.canViewLogs(userId, id))
                        .collect(Collectors.toList());
                if (!invalid.isEmpty()) {
                    log.warn("User {} attempted to access applications they don't have access to: {}", userId, invalid);
                    throw new IllegalArgumentException("User does not have access to application(s): " + invalid);
                }
            } else {
                // For admins: treat empty list as "all apps" (i.e. pass null to repo)
                if (appIds != null && appIds.isEmpty()) {
                    appIds = null;
                }
            }

            LocalDateTime now = LocalDateTime.now();
            Timestamp fromTs;
            String unit;
            ChronoUnit chronoUnit;

            switch (period.toLowerCase()) {
                case "last_hour":
                    fromTs = Timestamp.valueOf(now.minusHours(1));
                    unit = "minute";
                    chronoUnit = ChronoUnit.MINUTES;
                    break;
                case "last_24_hours":
                    fromTs = Timestamp.valueOf(now.minusHours(24));
                    unit = "hour";
                    chronoUnit = ChronoUnit.HOURS;
                    break;
                case "last_7_days":
                    fromTs = Timestamp.valueOf(now.minusDays(7));
                    unit = "hour"; // Use hour for better granularity
                    chronoUnit = ChronoUnit.HOURS;
                    break;
                case "last_30_days":
                    fromTs = Timestamp.valueOf(now.minusDays(30));
                    unit = "day";
                    chronoUnit = ChronoUnit.DAYS;
                    break;
                default:
                    throw new IllegalArgumentException("Invalid period: " + period + ". Valid values are: last_hour, last_24_hours, last_7_days, last_30_days");
            }

            Map<LocalDateTime, TrendBucketDTO> bucketMap = new LinkedHashMap<>();
            LocalDateTime current = fromTs.toLocalDateTime().truncatedTo(chronoUnit);
            while (!current.isAfter(now)) {
                TrendBucketDTO dto = new TrendBucketDTO();
                dto.setTime(Timestamp.valueOf(current));
                dto.setLevelCounts(new ArrayList<>());
                bucketMap.put(current, dto);
                current = current.plus(1, chronoUnit);
            }

            // Choose repository call depending on whether appIds filter is present
            List<Object[]> results;
            Timestamp toTs = Timestamp.valueOf(now);
            if (appIds == null) {
                // aggregated across all apps
                results = logRepository.getLogTrendsAllApps(unit, fromTs, toTs);
            } else {
                // filtered by provided appIds (non-empty list)
                results = logRepository.getLogTrendsForApps(unit, appIds, fromTs, toTs);
            }

            // Map rows safely: row[0]=time (Timestamp), row[1]=level (String), row[2]=count (Number)
            for (Object[] row : results) {
                Timestamp t = (Timestamp) row[0];
                LocalDateTime time = t.toLocalDateTime();
                String level = (String) row[1];
                Number countNum = (Number) row[2];
                long count = (countNum == null) ? 0L : countNum.longValue();

                TrendBucketDTO bucket = bucketMap.get(time);
                if (bucket != null) {
                    // update total count (Long) and add level count entry
                    bucket.setTotalCount(bucket.getTotalCount() + count);
                    LevelCountDTO levelCount = new LevelCountDTO();
                    levelCount.setLevel(level);
                    levelCount.setCount(Long.valueOf(count));
                    bucket.getLevelCounts().add(levelCount);
                } else {
                    // (Optional) log if a DB row doesn't match a pre-created bucket (possible truncation/timezone mismatch)
                    log.debug("Received data for time {} which did not match any bucket (maybe truncation mismatch)", time);
                }
            }

            log.debug("Generated {} trend buckets for user {}", bucketMap.size(), userId);
            return new ArrayList<>(bucketMap.values());

        } catch (IllegalArgumentException e) {
            log.error("Invalid argument in getLogTrends: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in getLogTrends for userId {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to get log trends", e);
        }
    }


    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public List<LevelCountDTO> getLogSummary(Long userId, String period, List<Long> appIds) {
        try {
            log.debug("Getting log summary for userId: {}, period: {}, appIds: {}", userId, period, appIds);

            if (userId == null) {
                throw new IllegalArgumentException("User ID cannot be null");
            }

            if (period == null || period.trim().isEmpty()) {
                throw new IllegalArgumentException("Period cannot be null or empty");
            }

            boolean isAdmin = permissionService.isAdmin(userId);

            // Validation for non-admin users: appIds must be provided and non-empty
            if (!isAdmin) {
                if (appIds == null || appIds.isEmpty()) {
                    throw new IllegalArgumentException("appIds cannot be null or empty for non-admin users");
                }
                List<Long> invalid = appIds.stream()
                        .filter(id -> !permissionService.canViewLogs(userId, id))
                        .collect(Collectors.toList());
                if (!invalid.isEmpty()) {
                    log.warn("User {} attempted to access applications they don't have access to: {}", userId, invalid);
                    throw new IllegalArgumentException("User does not have access to application(s): " + invalid);
                }
            } else {
                // Admin: empty list -> treat as all apps
                if (appIds != null && appIds.isEmpty()) {
                    appIds = null;
                }
            }

            LocalDateTime now = LocalDateTime.now();
            Timestamp fromTs;
            Timestamp toTs = Timestamp.valueOf(now);

            switch (period.toLowerCase()) {
                case "last_hour":
                    fromTs = Timestamp.valueOf(now.minusHours(1));
                    break;
                case "last_24_hours":
                    fromTs = Timestamp.valueOf(now.minusHours(24));
                    break;
                case "last_7_days":
                    fromTs = Timestamp.valueOf(now.minusDays(7));
                    break;
                case "last_30_days":
                    fromTs = Timestamp.valueOf(now.minusDays(30));
                    break;
                default:
                    throw new IllegalArgumentException("Invalid period: " + period + ". Valid values are: last_hour, last_24_hours, last_7_days, last_30_days");
            }

            // Choose repository call depending on whether appIds filter is present
            List<Object[]> results;
            if (appIds == null) {
                results = logRepository.getLogSummaryAllApps(fromTs, toTs);
            } else {
                results = logRepository.getLogSummaryForApps(appIds, fromTs, toTs);
            }

            // Map rows safely: row[0]=level (String), row[1]=count (Number)
            List<LevelCountDTO> summary = results.stream().map(row -> {
                LevelCountDTO dto = new LevelCountDTO();
                dto.setLevel((String) row[0]);
                Number n = (Number) row[1];
                long cnt = (n == null) ? 0L : n.longValue();
                dto.setCount(Long.valueOf(cnt));
                return dto;
            }).collect(Collectors.toList());

            log.debug("Generated summary with {} level counts for user {}", summary.size(), userId);
            return summary;

        } catch (IllegalArgumentException e) {
            log.error("Invalid argument in getLogSummary: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in getLogSummary for userId {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to get log summary", e);
        }
    }



}