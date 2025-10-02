package com.example.backend.services;

import com.example.backend.entities.Application;
import com.example.backend.entities.Logs;
import com.example.backend.repositories.ApplicationRepository;
import com.example.backend.repositories.LogsRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LogConsumer {
    private final LogsRepository logsRepository;
    private final ApplicationRepository applicationRepository;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "logs", groupId = "log-consumer-group")
    @Transactional
    public void consumeBatch(List<String> messages) {
        List<Logs> logsBatch = new ArrayList<>();
        DateTimeFormatter formatterWithMillis = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss,SSS");

        for (String message : messages) {
            try {
                JsonNode root = objectMapper.readTree(message);
                JsonNode json = root;

                // If Fluent Bit wrapped the actual JSON inside "log" as text, parse that inner JSON
                if (root.has("log") && root.get("log").isTextual()) {
                    String inner = root.get("log").asText();
                    try {
                        json = objectMapper.readTree(inner);
                    } catch (Exception innerEx) {
                        log.debug("Inner JSON parsing failed, using root JSON: {}", innerEx.getMessage());
                    }
                }

                // Find timestamp (try several common keys)
                String tsStr = null;
                if (json.has("timestamp") && !json.get("timestamp").isNull()) tsStr = json.get("timestamp").asText();
                else if (json.has("@timestamp") && !json.get("@timestamp").isNull()) tsStr = json.get("@timestamp").asText();
                else if (json.has("time") && !json.get("time").isNull()) tsStr = json.get("time").asText();

                Timestamp ts;
                if (tsStr != null && !tsStr.isEmpty()) {
                    // Parse timestamp and always convert to UTC
                    Instant instant;
                    try {
                        // Try parsing as numeric timestamp (Unix epoch in seconds or milliseconds)
                        // Handles: "1759403487567", "1.759403487567E9", "1759403487.567"
                        double numericTimestamp = Double.parseDouble(tsStr);
                        
                        // Determine if it's seconds or milliseconds
                        // Timestamps > 10 billion are in milliseconds
                        if (numericTimestamp > 10_000_000_000L) {
                            // Milliseconds since epoch
                            instant = Instant.ofEpochMilli((long) numericTimestamp);
                        } else {
                            // Seconds since epoch (with possible decimal for milliseconds)
                            long seconds = (long) numericTimestamp;
                            long nanos = (long) ((numericTimestamp - seconds) * 1_000_000_000);
                            instant = Instant.ofEpochSecond(seconds, nanos);
                        }
                        log.debug("Parsed numeric timestamp: {} -> UTC: {}", tsStr, instant);
                    } catch (NumberFormatException numEx) {
                        // Not a number, try other formats
                        try {
                            // Try ISO-8601 format (e.g., "2025-10-02T10:00:00Z" or with offset)
                            instant = Instant.parse(tsStr);
                            log.debug("Parsed ISO-8601 timestamp: {} -> UTC: {}", tsStr, instant);
                        } catch (Exception ex1) {
                            try {
                                // Try parsing as ZonedDateTime (handles timezone info like +05:00)
                                ZonedDateTime zdt = ZonedDateTime.parse(tsStr);
                                instant = zdt.toInstant(); // Converts to UTC
                                log.debug("Parsed ZonedDateTime: {} -> UTC: {}", tsStr, instant);
                            } catch (Exception ex2) {
                                try {
                                    // Try with milliseconds format (e.g., "2025-10-02 10:00:00,123")
                                    LocalDateTime ldt = LocalDateTime.parse(tsStr, formatterWithMillis);
                                    // IMPORTANT: Assume input is in LOCAL timezone (UTC+5 for Pakistan)
                                    // Convert from local to UTC by subtracting offset
                                    instant = ldt.atZone(java.time.ZoneId.systemDefault()).toInstant();
                                    log.debug("Parsed LocalDateTime: {} (system timezone) -> UTC: {}", tsStr, instant);
                                } catch (Exception ex3) {
                                    // Fallback to current time in UTC
                                    log.warn("Could not parse timestamp '{}', using current time. Error: {}", tsStr, ex3.getMessage());
                                    instant = Instant.now();
                                }
                            }
                        }
                    }
                    // Convert Instant (always UTC) to Timestamp
                    ts = Timestamp.from(instant);
                    log.debug("Final timestamp to store: {}", ts);
                } else {
                    // No timestamp provided, use current time in UTC
                    ts = Timestamp.from(Instant.now());
                }

                // Level and message (safe fallbacks)
                String level = json.has("level") && !json.get("level").isNull() ? json.get("level").asText() : "INFO";
                String msg = json.has("message") && !json.get("message").isNull() ? json.get("message").asText() : json.toString();

                // application_id (must exist for linking)
                long appId = -1L;
                if (json.has("application_id") && !json.get("application_id").isNull()) {
                    appId = json.get("application_id").asLong();
                } else if (root.has("application_id") && !root.get("application_id").isNull()) {
                    appId = root.get("application_id").asLong();
                }

                if (appId == -1L) {
                    log.warn("Skipping log message due to missing application_id. Payload: {}", message);
                    continue;
                }

                Application app = applicationRepository.findById(appId)
                        .orElse(null);
                
                if (app == null) {
                    log.warn("Skipping log message due to unknown application_id: {}. Payload: {}", appId, message);
                    continue;
                }
                
                // Skip logs from inactive applications
                if (app.getIsActive() != null && !app.getIsActive()) {
                    log.debug("Skipping log from inactive application ID: {}", appId);
                    continue;
                }

                Logs log = new Logs();
                log.setTimestamp(ts);
                log.setLevel(level);
                log.setMessage(msg);
                log.setApplication(app);
                logsBatch.add(log);

            } catch (Exception e) {
                log.error("Failed to parse log message: {}. Payload: {}", e.getMessage(), message, e);
            }
        }

        if (!logsBatch.isEmpty()) {
            try {
                logsRepository.saveAll(logsBatch);
                log.info("Successfully saved batch of {} logs", logsBatch.size());
            } catch (Exception e) {
                log.error("Failed to save log batch of {} logs: {}", logsBatch.size(), e.getMessage(), e);
                throw e; // Re-throw to trigger transaction rollback
            }
        } else {
            log.debug("No valid logs to save in this batch");
        }
    }
}
