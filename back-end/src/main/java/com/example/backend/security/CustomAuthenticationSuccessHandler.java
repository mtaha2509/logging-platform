package com.example.backend.security;

import com.example.backend.services.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.LinkedHashSet;
import java.util.Set;



@Component
@Data
public class CustomAuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static String frontendUrl;
    private final UserService userService;

    @Autowired
    public CustomAuthenticationSuccessHandler(UserService userService) {
        this.userService = userService;
    }

    @Value("${frontend.url}")
    public void setFrontendUrl(String frontendUrl) {
        CustomAuthenticationSuccessHandler.frontendUrl = frontendUrl;
    }
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        userService.processOAuth2User(oAuth2User);

        String email = oAuth2User.getAttribute("email");
        if (email != null) {
            userService.findByEmail(email).ifPresent(localUser -> {
                Set<GrantedAuthority> merged = new LinkedHashSet<>(oAuth2User.getAuthorities());
                merged.addAll(localUser.getAuthorities());

                if (oAuth2User instanceof OidcUser oidcPrincipal) {
                    OAuth2AuthenticationToken newAuth = getOAuth2AuthenticationToken(authentication, oidcPrincipal, merged);
                    SecurityContextHolder.getContext().setAuthentication(newAuth);
                } else {
                    OAuth2AuthenticationToken newAuth = new OAuth2AuthenticationToken(oAuth2User, merged,
                            (authentication instanceof OAuth2AuthenticationToken)
                                    ? ((OAuth2AuthenticationToken) authentication).getAuthorizedClientRegistrationId()
                                    : null);
                    SecurityContextHolder.getContext().setAuthentication(newAuth);
                }
            });
        }

        response.sendRedirect(frontendUrl + "/#dashboard");
        super.onAuthenticationSuccess(request, response, authentication);
    }

    private static OAuth2AuthenticationToken getOAuth2AuthenticationToken(Authentication authentication, OidcUser oidcPrincipal, Set<GrantedAuthority> merged) {
        DefaultOidcUser newPrincipal = new DefaultOidcUser(merged, oidcPrincipal.getIdToken(), oidcPrincipal.getUserInfo());
        String registrationId = null;
        if (authentication instanceof OAuth2AuthenticationToken) {
            registrationId = ((OAuth2AuthenticationToken) authentication).getAuthorizedClientRegistrationId();
        }
        return new OAuth2AuthenticationToken(newPrincipal, merged, registrationId);
    }

}