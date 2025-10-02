package com.example.backend.config;

import com.example.backend.dtos.ApiError;
import com.example.backend.exceptions.InvalidParameterException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.ThreadContext;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;


@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LogManager.getLogger(GlobalExceptionHandler.class);

    private String nowIso() {
        return Instant.now().toString();
    }

    // 400 - Bean Validation errors
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidationExceptions(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> Optional.ofNullable(error.getDefaultMessage()).orElse("No message available"),
                        (existing, replacement) -> existing // if duplicate, keep existing
                ));

        logger.warn("Validation failed for {} - Field errors: {}", request.getRequestURI(), fieldErrors.keySet());

        ApiError body = new ApiError(
                nowIso(),
                HttpStatus.BAD_REQUEST.value(),
                "Validation Failed",
                "Request validation failed",
                fieldErrors,
                request.getRequestURI(),
                null
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // 400 - ConstraintViolation (e.g., method-level @Validated)
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolationException(ConstraintViolationException ex, HttpServletRequest request) {
        // Build optional details if you want specific fields, here we collapse into a single message
        String joined = ex.getConstraintViolations()
                .stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining(", "));

        logger.warn("Constraint violation for {}: {}", request.getRequestURI(), joined);

        ApiError body = new ApiError(
                nowIso(),
                HttpStatus.BAD_REQUEST.value(),
                "Constraint Violation",
                joined,
                request.getRequestURI(),
                null
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // 400 - Type mismatch for request param / path var
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatchException(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String msg = String.format("Parameter '%s' should be of type %s",
                ex.getName(),
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");

        ApiError body = new ApiError(
                nowIso(),
                HttpStatus.BAD_REQUEST.value(),
                "Type Mismatch",
                msg,
                request.getRequestURI(),
                null
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // 400 - Malformed JSON
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        logger.warn("Malformed JSON request to {}: {}", request.getRequestURI(), ex.getMessage());
        
        ApiError body = new ApiError(
                nowIso(),
                HttpStatus.BAD_REQUEST.value(),
                "Malformed JSON",
                "Malformed JSON request body",
                request.getRequestURI(),
                null
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // 405 - Method not allowed
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        String supported = ex.getSupportedHttpMethods() != null
                ? ex.getSupportedHttpMethods().stream().map(HttpMethod::name).collect(Collectors.joining(", "))
                : "";

        String message = "Request method not supported" + (supported.isEmpty() ? "" : ": supported " + supported);

        ApiError body = new ApiError(
                nowIso(),
                HttpStatus.METHOD_NOT_ALLOWED.value(),
                "Method Not Allowed",
                message,
                request.getRequestURI(),
                null
        );

        HttpHeaders headers = new HttpHeaders();
        if (!supported.isEmpty()) {
            headers.add(HttpHeaders.ALLOW, supported);
        }

        return new ResponseEntity<>(body, headers, HttpStatus.METHOD_NOT_ALLOWED);
    }

    // 400 - Missing parameter
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParams(MissingServletRequestParameterException ex, HttpServletRequest request) {
        String msg = String.format("Required parameter '%s' is missing", ex.getParameterName());

        ApiError body = new ApiError(
                nowIso(),
                HttpStatus.BAD_REQUEST.value(),
                "Missing Parameter",
                msg,
                request.getRequestURI(),
                null
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // 400 - Invalid parameter exception (specific handling for parameter validation)
    @ExceptionHandler(InvalidParameterException.class)
    public ResponseEntity<ApiError> handleInvalidParameterException(InvalidParameterException ex, HttpServletRequest request) {
        logger.debug("InvalidParameterException: {}", ex.getMessage());
        
        ApiError body = new ApiError(
                nowIso(),
                HttpStatus.BAD_REQUEST.value(),
                "Invalid Parameters",
                ex.getMessage(),
                request.getRequestURI(),
                null
        );
        
        logger.info("Invalid parameter error for request [{}]: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // 400/409 - Illegal argument (detect duplicates for meaningful messages)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgumentException(IllegalArgumentException ex, HttpServletRequest request) {
        logger.debug("IllegalArgumentException: {}", ex.getMessage());
        
        String message = ex.getMessage();
        boolean isDuplicate = message != null && (message.contains("already exists") || message.contains("duplicate"));
        
        if (isDuplicate) {
            // Return 409 Conflict with meaningful message for duplicates
            ApiError body = new ApiError(
                    nowIso(),
                    HttpStatus.CONFLICT.value(),
                    "Resource Already Exists",
                    message,
                    request.getRequestURI(),
                    null
            );
            
            logger.info("Duplicate resource error for request [{}]: {}", request.getRequestURI(), message);
            return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
        } else {
            // Return 400 Bad Request with actual message for validation errors
            ApiError body = new ApiError(
                    nowIso(),
                    HttpStatus.BAD_REQUEST.value(),
                    "Invalid Argument",
                    message != null ? message : "Invalid input",
                    request.getRequestURI(),
                    null
            );
            
            logger.info("IllegalArgumentException for request [{}]: {}", request.getRequestURI(), message);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }
    }

    // 403 - Access denied (standardized message)
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDeniedException(org.springframework.security.access.AccessDeniedException ex, HttpServletRequest request) {
        logger.warn("Access denied to {}: {}", request.getRequestURI(), ex.getMessage());
        
        ApiError body = new ApiError(
                nowIso(),
                HttpStatus.FORBIDDEN.value(),
                "Access Denied",
                "You do not have permission to access this resource",
                request.getRequestURI(),
                null
        );

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    // 404 - Not found
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiError> handleNoSuchElementException(NoSuchElementException ex, HttpServletRequest request) {
        // sanitized message for public
        String publicMsg = "Requested resource not found";

        ApiError body = new ApiError(
                nowIso(),
                HttpStatus.NOT_FOUND.value(),
                "Resource Not Found",
                publicMsg,
                request.getRequestURI(),
                null
        );

        // log the original for diagnostics
        logger.info("NoSuchElementException for [{}]: {}", request.getRequestURI(), ex.getMessage());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    // Generic fallback - logs full stack and returns traceId for correlation
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGenericException(Exception ex, HttpServletRequest request) {
        // Prefer traceid from ThreadContext (populated by LoggingFilter). Fall back to header, then generate.
        String traceId = ThreadContext.get("traceid");
        if (traceId == null || traceId.isEmpty()) {
            traceId = request.getHeader("X-Trace-ID");
        }
        if (traceId == null || traceId.isEmpty()) {
            traceId = UUID.randomUUID().toString();
        }

        // Log full stack trace with traceId so support can correlate. ThreadContext already contains traceid.
        logger.error("Unexpected error (traceId={}): requestPath={}", traceId, request.getRequestURI(), ex);

        ApiError body = new ApiError(
                nowIso(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "An unexpected error occurred",
                request.getRequestURI(),
                traceId
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}



