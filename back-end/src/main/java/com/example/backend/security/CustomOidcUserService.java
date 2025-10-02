package com.example.backend.security;

import com.example.backend.entities.User;
import com.example.backend.repositories.UserRepository;
import com.google.api.services.directory.Directory;
import jakarta.transaction.Transactional;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class CustomOidcUserService extends OidcUserService {

    private final Directory directoryService;
    private final UserRepository userRepository;

    public CustomOidcUserService(Directory directoryService,
                                 UserRepository userRepository) {
        this.directoryService = directoryService;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        // Use the default implementation to fetch ID token & userinfo
        OidcUser oidcUser = super.loadUser(userRequest);

        Map<String, Object> attributes = oidcUser.getAttributes();
        String email = (String) attributes.get("email");

        if (email == null || !email.endsWith("@gosaas.io")) {
            throw new OAuth2AuthenticationException("User email does not belong to @gosaas.io domain");
        }
        com.google.api.services.directory.model.User directoryUser;
        try {
            directoryUser = directoryService.users().get(email).execute();
            if (directoryUser == null || directoryUser.getPrimaryEmail() == null
                    || !directoryUser.getPrimaryEmail().endsWith("@gosaas.io")) {
                throw new OAuth2AuthenticationException("User not found in directory or invalid domain");
            }
        } catch (Exception e) {
            OAuth2Error error = new OAuth2Error("access_denied", "User is not in the required organization", null);
            throw new OAuth2AuthenticationException(error);
        }
        Set<GrantedAuthority> merged = new LinkedHashSet<>(oidcUser.getAuthorities());
        Optional<User> maybeLocalUser = userRepository.findByEmail(email);
        maybeLocalUser.ifPresent(localUser -> merged.addAll(localUser.getAuthorities()));
        return new DefaultOidcUser(merged, userRequest.getIdToken(), oidcUser.getUserInfo());
    }
}
