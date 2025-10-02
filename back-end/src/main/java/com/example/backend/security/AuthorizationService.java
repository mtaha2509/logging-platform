package com.example.backend.security;

import com.example.backend.entities.User;
import com.example.backend.repositories.UserRepository;
import com.example.backend.services.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service for method-level security authorization checks.
 * Used with @PreAuthorize annotations in Spring Security.
 */
@Service("authz")
@RequiredArgsConstructor
public class AuthorizationService {
    
    private final PermissionService permissionService;
    private final UserRepository userRepository;
    
    /**
     * Check if the current user is an admin.
     */
    public boolean isAdmin() {
        Long userId = getCurrentUserId();
        return userId != null && permissionService.isAdmin(userId);
    }
    
    /**
     * Check if the current user can view a specific application.
     */
    public boolean canViewApplication(Long applicationId) {
        Long userId = getCurrentUserId();
        return userId != null && permissionService.canViewApplication(userId, applicationId);
    }
    
    /**
     * Check if the current user can view logs for a specific application.
     */
    public boolean canViewLogs(Long applicationId) {
        Long userId = getCurrentUserId();
        return userId != null && permissionService.canViewLogs(userId, applicationId);
    }
    
    /**
     * Check if the current user has admin role or can view the specific application.
     */
    public boolean isAdminOrCanViewApplication(Long applicationId) {
        return isAdmin() || canViewApplication(applicationId);
    }
    
    /**
     * Get the current authenticated user's ID from the security context.
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }
        
        Object principal = authentication.getPrincipal();
        String email = extractEmail(principal, authentication);
        
        if (email != null) {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                return userOpt.get().getId();
            }
        }
        
        return null;
    }
    
    /**
     * Extract email from authentication principal.
     */
    private String extractEmail(Object principal, Authentication auth) {
        if (principal instanceof OidcUser oidc) {
            return oidc.getClaimAsString("email");
        } else if (principal instanceof OAuth2User oauth2) {
            Object attr = oauth2.getAttribute("email");
            return attr == null ? null : attr.toString();
        } else {
            return auth.getName();
        }
    }
}
