package com.example.backend.repositories;

import com.example.backend.dtos.NotificationDto;
import com.example.backend.entities.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    @Query("SELECT new com.example.backend.dtos.NotificationDto(n.id, n.recipient.id, n.message, n.isRead, n.createdAt) " +
           "FROM Notification n WHERE n.recipient.id = :recipientId ORDER BY n.createdAt DESC")
    Page<NotificationDto> findNotificationDtosByRecipientId(@Param("recipientId") Long recipientId, Pageable pageable);
    
    long countByRecipientIdAndIsRead(Long recipientId, boolean isRead);
}