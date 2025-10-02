package com.example.backend.controllers;

import com.example.backend.dtos.NotificationDto;
import com.example.backend.dtos.UserInfo;
import com.example.backend.services.AuthService;
import com.example.backend.services.NotificationService;
import com.example.backend.validation.ValidPageable;
import com.example.backend.validation.ParameterCountValidator;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private static final Logger logger = LogManager.getLogger(NotificationController.class);
    private final NotificationService notificationService;
    private final AuthService authService;

    @GetMapping
    public Page<NotificationDto> getUserNotifications(
            @ValidPageable Pageable pageable,
            Authentication authentication,
            HttpServletRequest httpRequest) {

        logger.info("Fetching notifications (page: {}, size: {})", pageable.getPageNumber(), pageable.getPageSize());
        
        // Validate that only page and size parameters are provided
        ParameterCountValidator.validateGetRequest(httpRequest, "page", "size", "sort");

        UserInfo currentUser = authService.getCurrentUser(authentication)
                .orElseThrow(() -> new AccessDeniedException("User not authenticated"));
        
        Page<NotificationDto> notifications = notificationService.getNotificationsForUser(currentUser.getId(), pageable);
        logger.info("Retrieved {} notifications for user ID: {}", notifications.getNumberOfElements(), currentUser.getId());
        return notifications;
    }




    @PostMapping("/{notificationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAsRead(
            @PathVariable Long notificationId,
            Authentication authentication,
            HttpServletRequest httpRequest) {

        logger.info("Marking notification ID: {} as read", notificationId);
        
        // Validate that no extra parameters are provided
        ParameterCountValidator.validatePostRequest(httpRequest);

        UserInfo currentUser = authService.getCurrentUser(authentication)
                .orElseThrow(() -> new AccessDeniedException("User not authenticated"));

        notificationService.markNotificationAsRead(currentUser.getId(), notificationId);
        logger.info("Successfully marked notification ID: {} as read for user ID: {}", notificationId, currentUser.getId());
    }
}