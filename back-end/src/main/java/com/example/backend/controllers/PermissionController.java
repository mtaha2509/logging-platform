package com.example.backend.controllers;

import com.example.backend.dtos.AssignPermissionRequest;
import com.example.backend.dtos.BulkRevokeRequest;
import com.example.backend.dtos.UserInfo;
import com.example.backend.entities.Permission;
import com.example.backend.services.AuthService;
import com.example.backend.services.PermissionService;
import com.example.backend.validation.ParameterCountValidator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
public class PermissionController {
    private static final Logger logger = LogManager.getLogger(PermissionController.class);
    private final PermissionService permissionService;
    private final AuthService authService;

    /**
     * Bulk assign permissions - creates cartesian product of users × applications.
     * Example: userIds=[1,2] + appIds=[10,20] = creates 4 permissions
     * Uses POST with JSON body (not query params) because:
     * 1. Modifying state (creating permissions)
     * 2. Potentially large arrays that exceed URL length limits
     * 3. Arrays in body are more semantic for bulk operations
     */
    @PostMapping
    public List<Permission> createPermissions(@Valid @RequestBody AssignPermissionRequest request, Authentication authentication, HttpServletRequest httpRequest) {
        logger.info("Assigning permissions for {} users to {} applications", request.getUserIds().size(), request.getAppIds().size());
        
        // Validate that no extra parameters are provided
        ParameterCountValidator.validatePostRequest(httpRequest);
        
        if (request == null) {
            throw new IllegalArgumentException("Request body cannot be null");
        }
        
        UserInfo currentUser = authService.getCurrentUser(authentication)
                .orElseThrow(() -> new AccessDeniedException("User not authenticated"));
        
        if (!permissionService.isAdmin(currentUser.getId())) {
            logger.warn("Non-admin user {} attempted to assign permissions", currentUser.getId());
            throw new AccessDeniedException("Only administrators can assign permissions");
        }
        
        List<Permission> permissions = permissionService.assignUsersToApps(request.getUserIds(), request.getAppIds());
        logger.info("Admin {} successfully created {} permissions", currentUser.getId(), permissions.size());
        return permissions;
    }
    
    /**
     * Bulk revoke permissions - removes cartesian product of users × applications.
     * Example: userIds=[1,2] + appIds=[10,20] = removes 4 permissions
     * Uses DELETE with JSON body (not query params) because:
     * 1. Modifying state (deleting permissions)
     * 2. DELETE with body is acceptable for bulk operations per REST guidelines
     * 3. More semantic than encoding arrays in URL
     */
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePermissions(@Valid @RequestBody BulkRevokeRequest request, Authentication authentication, HttpServletRequest httpRequest) {
        logger.info("Revoking permissions for {} users from {} applications", request.getUserIds().size(), request.getAppIds().size());
        
        // Validate that no extra parameters are provided
        ParameterCountValidator.validateDeleteRequest(httpRequest);
        
        if (request == null) {
            throw new IllegalArgumentException("Request body cannot be null");
        }
        
        UserInfo currentUser = authService.getCurrentUser(authentication)
                .orElseThrow(() -> new AccessDeniedException("User not authenticated"));
        
        if (!permissionService.isAdmin(currentUser.getId())) {
            logger.warn("Non-admin user {} attempted to revoke permissions", currentUser.getId());
            throw new AccessDeniedException("Only administrators can revoke permissions");
        }
        
        permissionService.revokeAssignments(request.getUserIds(), request.getAppIds());
        logger.info("Admin {} successfully revoked permissions for {} users from {} apps", currentUser.getId(), request.getUserIds().size(), request.getAppIds().size());
    }
}
