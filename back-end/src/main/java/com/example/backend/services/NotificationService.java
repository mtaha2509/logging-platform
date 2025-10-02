package com.example.backend.services;

import com.example.backend.dtos.NotificationDto;
import com.example.backend.entities.*;
import com.example.backend.repositories.NotificationRepository;
import com.example.backend.repositories.PermissionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final PermissionRepository permissionRepository;
    private final NotificationRepository notificationRepository;

    /**
     * This method runs in a single, dedicated transaction to create
     * all necessary notifications for a triggered alert.
     */
    @Transactional
    public void createNotificationsForTriggeredAlert(Alert alert, long eventCount) {
        Application application = alert.getApplication();
        List<Permission> permissions = permissionRepository.findByApplicationIdAndStatus(application.getId(), "ACTIVE");
        List<User> usersToNotify = permissions.stream()
                .map(Permission::getUser)
                .toList();

        if (usersToNotify.isEmpty()) {
            log.warn("Alert {} triggered, but no active users have permissions for application {}.",
                    alert.getId(), application.getName());
            return;
        }

        String message = String.format(
                "Alert for '%s': Found %d logs with level '%s', exceeding the threshold of %d.",
                application.getName(), eventCount, alert.getLevel(), alert.getCount()
        );

        List<Notification> newNotifications = usersToNotify.stream()
                .map(user -> {
                    Notification notification = new Notification();
                    notification.setRecipient(user);
                    notification.setMessage(message);
                    notification.setTriggeringAlert(alert);
                    return notification;
                })
                .collect(Collectors.toList());

        notificationRepository.saveAll(newNotifications);
        log.info("Created {} notifications for triggered alert ID {}.", newNotifications.size(), alert.getId());
    }
    
    public Page<NotificationDto> getNotificationsForUser(Long userId, Pageable pageable) {
        return notificationRepository.findNotificationDtosByRecipientId(userId, pageable);
    }

    @Transactional
    public void markNotificationAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new java.util.NoSuchElementException("Notification not found with ID: " + notificationId));

        if (!notification.getRecipient().getId().equals(userId)) {
            throw new AccessDeniedException("You do not have permission to access this notification.");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }
}