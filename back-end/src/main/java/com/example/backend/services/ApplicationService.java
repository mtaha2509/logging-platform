package com.example.backend.services;

import com.example.backend.controllers.ApplicationController;
import com.example.backend.dtos.CreateApplicationRequest;
import com.example.backend.dtos.UpdateApplicationRequest;
import com.example.backend.entities.*;
import com.example.backend.repositories.*;
import com.example.backend.specs.ApplicationSpecs;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final PermissionService permissionService;
    private static final Logger logger = LogManager.getLogger(ApplicationService.class);

    @Transactional
    @PreAuthorize("@authz.isAdmin()")
    public Application createApplication(CreateApplicationRequest request) {
        if (applicationRepository.findByName(request.getName()).isPresent()) {
            throw new IllegalArgumentException("An application with name '" + request.getName() + "' already exists");
        }
        Application app = new Application();
        app.setName(request.getName());
        app.setDescription(request.getDescription());
        app.setUpdatedAt(Timestamp.from(Instant.now()));
        return applicationRepository.save(app);
    }

    @PreAuthorize("@authz.canViewApplication(#id)")
    public Optional<Application> getApplicationById(Long userId, Long id) {
        return applicationRepository.findById(id);
    }

    public List<Application> getAllApplications(Long userId) {
        List<Long> allowedAppIds = permissionService.listAssignedApplicationIds(userId);
        if (allowedAppIds.isEmpty()) {
            return List.of(); // User has no app permissions
        }

        return applicationRepository.findAllByIdInOrderByUpdatedAtDesc(allowedAppIds);
    }

    @Transactional
    @PreAuthorize("@authz.isAdmin()")
    public Application updateApplication(Long applicationId, UpdateApplicationRequest request) {
        // Check if application exists
        Application existingApp = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new NoSuchElementException("Application not found with ID: " + applicationId));
        
        // Check for duplicate name (excluding current application)
        if (applicationRepository.findByNameAndIdNot(request.getName(), applicationId).isPresent()) {
            throw new IllegalArgumentException("An application with name '" + request.getName() + "' already exists");
        }
        
        // Update application fields
        existingApp.setName(request.getName());
        existingApp.setDescription(request.getDescription());
        existingApp.setUpdatedAt(Timestamp.from(Instant.now()));
        
        // Update isActive if provided
        if (request.getIsActive() != null) {
            existingApp.setIsActive(request.getIsActive());
            logger.info("Application ID {} status changed to: {}", applicationId, 
                       request.getIsActive() ? "ACTIVE" : "INACTIVE");
        }
        
        return applicationRepository.save(existingApp);
    }

}