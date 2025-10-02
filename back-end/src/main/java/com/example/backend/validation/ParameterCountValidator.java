package com.example.backend.validation;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class to validate that requests don't contain more parameters than expected.
 */
public class ParameterCountValidator {

    /**
     * Validates that the request doesn't contain more parameters than the expected count.
     * 
     * @param request The HTTP request
     * @param expectedParamCount The expected number of parameters
     * @param allowedParams Array of allowed parameter names (case-insensitive)
     * @throws IllegalArgumentException if too many parameters are provided
     */
    public static void validateParameterCount(HttpServletRequest request, int expectedParamCount, String... allowedParams) {
        Map<String, String> requestParams = new HashMap<>();
        
        // Get all request parameters
        Enumeration<String> paramNames = request.getParameterNames();
        while (paramNames.hasMoreElements()) {
            String paramName = paramNames.nextElement();
            String paramValue = request.getParameter(paramName);
            requestParams.put(paramName.toLowerCase(), paramValue);
        }
        
        // Check if we have more parameters than expected
        if (requestParams.size() > expectedParamCount) {
            StringBuilder errorMessage = new StringBuilder("Too many parameters provided. Expected at most ")
                    .append(expectedParamCount)
                    .append(" parameters");
            
            if (allowedParams.length > 0) {
                errorMessage.append(": ");
                for (int i = 0; i < allowedParams.length; i++) {
                    if (i > 0) errorMessage.append(", ");
                    errorMessage.append(allowedParams[i]);
                }
            }
            
            errorMessage.append(". Received: ").append(requestParams.keySet());
            
            throw new IllegalArgumentException(errorMessage.toString());
        }
        
        // Check for unknown parameters if allowedParams is specified
        if (allowedParams.length > 0) {
            for (String paramName : requestParams.keySet()) {
                boolean isAllowed = false;
                for (String allowedParam : allowedParams) {
                    if (paramName.equalsIgnoreCase(allowedParam)) {
                        isAllowed = true;
                        break;
                    }
                }
                if (!isAllowed) {
                    throw new IllegalArgumentException("Unknown parameter: '" + paramName + 
                            "'. Allowed parameters: " + String.join(", ", allowedParams));
                }
            }
        }
    }
    
    /**
     * Validates parameter count for GET requests with specific allowed parameters.
     * 
     * @param request The HTTP request
     * @param allowedParams Array of allowed parameter names
     * @throws IllegalArgumentException if invalid parameters are found
     */
    public static void validateGetRequest(HttpServletRequest request, String... allowedParams) {
        if (request.getMethod().equals(RequestMethod.GET.name())) {
            validateParameterCount(request, allowedParams.length, allowedParams);
        }
    }
    
    /**
     * Validates parameter count for POST requests (typically should have no query parameters).
     * 
     * @param request The HTTP request
     * @param allowedParams Array of allowed parameter names (usually empty for POST)
     * @throws IllegalArgumentException if invalid parameters are found
     */
    public static void validatePostRequest(HttpServletRequest request, String... allowedParams) {
        if (request.getMethod().equals(RequestMethod.POST.name())) {
            validateParameterCount(request, allowedParams.length, allowedParams);
        }
    }
    
    /**
     * Validates parameter count for PATCH requests.
     * 
     * @param request The HTTP request
     * @param allowedParams Array of allowed parameter names
     * @throws IllegalArgumentException if invalid parameters are found
     */
    public static void validatePatchRequest(HttpServletRequest request, String... allowedParams) {
        if (request.getMethod().equals(RequestMethod.PATCH.name())) {
            validateParameterCount(request, allowedParams.length, allowedParams);
        }
    }
    
    /**
     * Validates parameter count for DELETE requests.
     * 
     * @param request The HTTP request
     * @param allowedParams Array of allowed parameter names
     * @throws IllegalArgumentException if invalid parameters are found
     */
    public static void validateDeleteRequest(HttpServletRequest request, String... allowedParams) {
        if (request.getMethod().equals(RequestMethod.DELETE.name())) {
            validateParameterCount(request, allowedParams.length, allowedParams);
        }
    }
}
