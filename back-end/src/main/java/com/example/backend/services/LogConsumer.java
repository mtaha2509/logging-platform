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
                    // Try known patterns
                    Timestamp tmp;
                    try {
                        LocalDateTime ldt = LocalDateTime.parse(tsStr, formatterWithMillis);
                        tmp = Timestamp.valueOf(ldt);
                    } catch (Exception ex1) {
                        try {
                            Instant inst = Instant.parse(tsStr); // ISO fallback
                            tmp = Timestamp.from(inst);
                        } catch (Exception ex2) {
                            tmp = new Timestamp(System.currentTimeMillis());
                        }
                    }
                    ts = tmp;
                } else {
                    ts = new Timestamp(System.currentTimeMillis());
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
