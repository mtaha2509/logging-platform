package com.example.backend.config;


import com.example.backend.filter.LoggingFilter;
import com.example.backend.security.CustomAuthenticationSuccessHandler;
import com.example.backend.security.CustomOidcUserService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final CustomOidcUserService customOidcUserService;
    //private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomAuthenticationSuccessHandler customAuthenticationSuccessHandler;
    private final CorsConfigurationSource corsConfigurationSource;
    private final LoggingFilter loggingFilter;

    public SecurityConfig(CustomOidcUserService customOidcUserService, 
                         CustomAuthenticationSuccessHandler customAuthenticationSuccessHandler,
                         CorsConfigurationSource corsConfigurationSource,
                         LoggingFilter loggingFilter) {
        //this.customOAuth2UserService = customOAuth2UserService;
        this.customOidcUserService = customOidcUserService;
        this.customAuthenticationSuccessHandler = customAuthenticationSuccessHandler;
        this.corsConfigurationSource = corsConfigurationSource;
        this.loggingFilter = loggingFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Add LoggingFilter BEFORE security filters to ensure trace ID is generated for all requests
                .addFilterBefore(loggingFilter, SecurityContextHolderFilter.class)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/", "/login**")
                        .permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(endpoint -> endpoint
                                .oidcUserService(customOidcUserService)
                        )
                        .successHandler(customAuthenticationSuccessHandler)
                )
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(exception -> exception
                        .accessDeniedPage("/access-denied")  // Handle access denied
                );

        return http.build();
    }
}