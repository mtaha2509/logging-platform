package com.example.backend.services;

import com.example.backend.dtos.UserInfo;
import com.example.backend.entities.Role;
import com.example.backend.entities.User;
import com.example.backend.repositories.UserRepository;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PermissionService permissionService;

    public AuthService(UserRepository userRepository, PermissionService permissionService) {
        this.userRepository = userRepository;
        this.permissionService = permissionService;
    }

    public Optional<UserInfo> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();
        String email = extractEmail(principal, authentication);

        // 1) Prefer DB user when present
        if (email != null) {
            Optional<User> localOpt = userRepository.findByEmail(email);
            if (localOpt.isPresent()) {
                User lu = localOpt.get();
                List<Long> assignedAppIds = permissionService.listAssignedApplicationIds(lu.getId());
                UserInfo dto = new UserInfo(
                        lu.getId(),
                        lu.getEmail(),
                        lu.getRole(),
                        assignedAppIds,
                        Timestamp.valueOf(LocalDateTime.now())
                );
                return Optional.of(dto);
            }
        }
        return Optional.empty();
    }

    private String extractEmail(Object principal, Authentication auth) {
        if (principal instanceof OidcUser oidc) {
            return oidc.getClaimAsString("email");
        } else if (principal instanceof OAuth2User oauth2) {
            Object attr = oauth2.getAttribute("email");
            return attr == null ? null : attr.toString();
        } else {
            // as fallback, use authentication name (maybe email/username)
            return auth.getName();
        }
    }
}
