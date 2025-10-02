package com.example.backend.controllers;

import com.example.backend.dtos.UserInfo;
import com.example.backend.services.AuthService;
import com.example.backend.validation.ParameterCountValidator;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private static final Logger logger = LogManager.getLogger(AuthController.class);
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping({"/api/auth/user", "/user"})
    public ResponseEntity<UserInfo> currentUser(Authentication authentication, HttpServletRequest httpRequest) {
        logger.info("Getting current user info");
        
        // Validate that no extra parameters are provided
        ParameterCountValidator.validateGetRequest(httpRequest);
        
        return authService.getCurrentUser(authentication)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }
}

