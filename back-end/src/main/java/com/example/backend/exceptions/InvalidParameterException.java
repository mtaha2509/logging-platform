package com.example.backend.exceptions;

/**
 * Exception thrown when request parameters are invalid (e.g., wrong type, out of range, too many parameters).
 * This will be handled by the GlobalExceptionHandler and return a 400 Bad Request response.
 */
public class InvalidParameterException extends IllegalArgumentException {
    
    public InvalidParameterException(String message) {
        super(message);
    }
    
    public InvalidParameterException(String message, Throwable cause) {
        super(message, cause);
    }
}
