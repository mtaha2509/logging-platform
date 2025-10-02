package com.example.backend.services;

import com.example.backend.entities.Application;
import com.example.backend.entities.Permission;
import com.example.backend.entities.Role;
import com.example.backend.entities.User;
import com.example.backend.repositories.ApplicationRepository;
import com.example.backend.repositories.PermissionRepository;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService {
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    @Transactional
    @PreAuthorize("@authz.isAdmin()")
    public List<Permission> assignUsersToApps(List<Long> userIds, List<Long> appIds) {
        try {
            log.debug("Assigning users {} to applications {}", userIds, appIds);
            
            if (userIds == null || userIds.isEmpty()) {
                throw new IllegalArgumentException("User IDs cannot be null or empty");
            }
            
            if (appIds == null || appIds.isEmpty()) {
                throw new IllegalArgumentException("Application IDs cannot be null or empty");
            }
            
            List<User> users = userRepository.findAllById(userIds);
            if (users.size() != userIds.size()) {
                List<Long> foundUserIds = users.stream().map(User::getId).toList();
                List<Long> missingUserIds = userIds.stream()
                    .filter(id -> !foundUserIds.contains(id))
                    .toList();
                throw new IllegalArgumentException("Users not found with IDs: " + missingUserIds);
            }
            
            List<Application> apps = applicationRepository.findAllById(appIds);
            if (apps.size() != appIds.size()) {
                List<Long> foundAppIds = apps.stream().map(Application::getId).toList();
                List<Long> missingAppIds = appIds.stream()
                    .filter(id -> !foundAppIds.contains(id))
                    .toList();
                throw new IllegalArgumentException("Applications not found with IDs: " + missingAppIds);
            }
            
            List<Permission> existing = permissionRepository.findByUserIdInAndApplicationIdIn(userIds, appIds);
            Map<String, Permission> existingMap = existing.stream()
                    .collect(Collectors.toMap(p -> p.getUser().getId() + ":" + p.getApplication().getId(), Function.identity()));
            List<Permission> toSave = new ArrayList<>();

            for (User u : users) {
                for (Application a: apps) {
                    String key = u.getId() + ":" + a.getId();
                    Permission p = existingMap.get(key);
                    if (p != null) {
                        if (!"ACTIVE".equals(p.getStatus())) {
                            p.setStatus("ACTIVE"); // reactivate
                            toSave.add(p);
                            log.debug("Reactivating permission for user {} and app {}", u.getId(), a.getId());
                        }
                    } else {
                        Permission np = new Permission();
                        np.setUser(u);
                        np.setApplication(a);
                        np.setStatus("ACTIVE");
                        toSave.add(np);
                        log.debug("Creating new permission for user {} and app {}", u.getId(), a.getId());
                    }
                }
            }
            
            List<Permission> savedPermissions = permissionRepository.saveAll(toSave);
            log.info("Successfully assigned {} permissions", savedPermissions.size());
            return savedPermissions;
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid argument in assignUsersToApps: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in assignUsersToApps: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to assign users to applications", e);
        }
    }


    public List<Application> getAssignedAppsForUser(Long userId) {
        return permissionRepository.findByUserIdAndStatus(userId, "ACTIVE")
                .stream()
                .map(Permission::getApplication)
                .collect(Collectors.toList());
    }

    @Transactional
    @PreAuthorize("@authz.isAdmin()")
    public void revokeAssignments(List<Long> userIds, List<Long> appIds) {
        try {
            log.debug("Revoking assignments for users {} from applications {}", userIds, appIds);
            
            if (userIds == null || userIds.isEmpty()) {
                throw new IllegalArgumentException("User IDs cannot be null or empty");
            }
            
            if (appIds == null || appIds.isEmpty()) {
                throw new IllegalArgumentException("Application IDs cannot be null or empty");
            }
            
            List<Permission> permissions = permissionRepository.findByUserIdInAndApplicationIdIn(userIds, appIds);
            
            if (permissions.isEmpty()) {
                log.warn("No permissions found to revoke for users {} and applications {}", userIds, appIds);
                return;
            }
            
            permissions.forEach(p -> {
                p.setStatus("REVOKED");
                log.debug("Revoking permission for user {} and app {}", p.getUser().getId(), p.getApplication().getId());
            });
            
            permissionRepository.saveAll(permissions);
            log.info("Successfully revoked {} permissions", permissions.size());
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid argument in revokeAssignments: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error in revokeAssignments: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to revoke assignments", e);
        }
    }

    public List<User> getAssignedUsersForApp(Long appId) {
        return permissionRepository.findByApplicationIdAndStatus(appId, "ACTIVE").stream()
                .map(Permission::getUser)
                .collect(Collectors.toList());
    }

    // Authorization methods for access control
    public boolean isAdmin(Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getRole() == Role.ADMIN)
                .orElse(false);
    }

    public boolean canViewApplication(Long userId, Long appId) {
        // Admins can view all applications
        if (isAdmin(userId)) {
            return true;
        }
        
        // Regular users can only view applications they have permissions for
        return permissionRepository.findByUserIdAndApplicationIdAndStatus(userId, appId, "ACTIVE")
                .isPresent();
    }

    public boolean canViewLogs(Long userId, Long appId) {
        // Same logic as canViewApplication - users can view logs for apps they have access to
        return canViewApplication(userId, appId);
    }

    public List<Long> listAssignedApplicationIds(Long userId) {
        // Admins can see all applications
        if (isAdmin(userId)) {
            return applicationRepository.findAll().stream()
                    .map(Application::getId)
                    .collect(Collectors.toList());
        }
        
        // Regular users only see assigned applications
        return permissionRepository.findByUserIdAndStatus(userId, "ACTIVE")
                .stream()
                .map(permission -> permission.getApplication().getId())
                .collect(Collectors.toList());
    }
}