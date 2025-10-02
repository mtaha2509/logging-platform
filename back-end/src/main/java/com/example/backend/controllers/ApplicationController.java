package com.example.backend.controllers;

import com.example.backend.dtos.ApplicationInfo;
import com.example.backend.dtos.CreateApplicationRequest;
import com.example.backend.dtos.UpdateApplicationRequest;
import com.example.backend.dtos.UserInfo;
import com.example.backend.entities.Application;
import com.example.backend.entities.User;
import com.example.backend.mappers.ApplicationMapper;
import com.example.backend.services.ApplicationService;
import com.example.backend.services.AuthService;
import com.example.backend.services.PermissionService;
import com.example.backend.validation.ParameterCountValidator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/applications")
@RequiredArgsConstructor
public class ApplicationController {
    private static final Logger logger = LogManager.getLogger(ApplicationController.class);
    private final ApplicationService applicationService;
    private final PermissionService permissionService;
    private final ApplicationMapper applicationMapper;
    private final AuthService authService;

    @PostMapping
    public Application createApplication(@Valid @RequestBody CreateApplicationRequest request, HttpServletRequest httpRequest) {
        logger.info("Creating new application: {}", request.getName());
        
        // Validate that no extra parameters are provided
        ParameterCountValidator.validatePostRequest(httpRequest);
        
        Application created = applicationService.createApplication(request);
        logger.info("Successfully created application with ID: {}", created.getId());
        return created;
    }

    @GetMapping
    public List<ApplicationInfo> getAllApplications(Authentication authentication, HttpServletRequest httpRequest) {
        logger.info("Fetching all applications for authenticated user");
        
        // Validate that no extra parameters are provided
        ParameterCountValidator.validateGetRequest(httpRequest);
        
        UserInfo currentUser = authService.getCurrentUser(authentication)
                .orElseThrow(() -> new AccessDeniedException("User not authenticated"));
        
        List<Application> applications = applicationService.getAllApplications(currentUser.getId());
        logger.info("Retrieved {} applications for user ID: {}", applications.size(), currentUser.getId());
        return applicationMapper.toApplicationInfoList(applications);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Application> getApplicationById(@PathVariable Long id, Authentication authentication, HttpServletRequest httpRequest) {
        logger.info("Fetching application with ID: {}", id);
        
        // Validate that no extra parameters are provided
        ParameterCountValidator.validateGetRequest(httpRequest);
        
        UserInfo currentUser = authService.getCurrentUser(authentication)
                .orElseThrow(() -> new AccessDeniedException("User not authenticated"));
        
        ResponseEntity<Application> response = applicationService.getApplicationById(currentUser.getId(), id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        
        if (response.getStatusCode().is2xxSuccessful()) {
            logger.info("Found application ID: {}", id);
        } else {
            logger.warn("Application not found with ID: {}", id);
        }
        return response;
    }

    @GetMapping("/{applicationId}/users")
    public List<User> getApplicationPermissionedUsers(@PathVariable Long applicationId, HttpServletRequest httpRequest) {
        logger.info("Fetching users with access to application ID: {}", applicationId);
        
        // Validate that no extra parameters are provided
        ParameterCountValidator.validateGetRequest(httpRequest);
        
        List<User> users = permissionService.getAssignedUsersForApp(applicationId);
        logger.info("Found {} users with access to application ID: {}", users.size(), applicationId);
        return users;
    }

    @PatchMapping("/{id}")
    public Application updateApplication(@PathVariable Long id, @Valid @RequestBody UpdateApplicationRequest request, HttpServletRequest httpRequest) {
        logger.info("Updating application ID: {}", id);
        
        // Validate that no extra parameters are provided
        ParameterCountValidator.validatePatchRequest(httpRequest);
        
        Application updated = applicationService.updateApplication(id, request);
        logger.info("Successfully updated application ID: {}", id);
        return updated;
    }
}