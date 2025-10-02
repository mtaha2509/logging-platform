package com.example.backend.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
public class ApiError {
    private String timestamp; // ISO string, e.g. Instant.now().toString()
    private int status;
    private String error;
    private String message;
    private Map<String, String> errors; // optional field -> message map (validation)
    private String path; // request path
    private String traceId;

    public ApiError(String timestamp, int status, String error, String message, Map<String, String> errors, String path, String traceId) {
        this.timestamp = timestamp;
        this.status = status;
        this.error = error;
        this.message = message;
        this.errors = errors;
        this.path = path;
        this.traceId = traceId;
    }

    public ApiError(String timestamp, int status, String error, String message, String path, String traceId) {
        this(timestamp, status, error, message, null, path, traceId);
    }
}