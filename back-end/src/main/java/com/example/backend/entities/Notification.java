package com.example.backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

@Entity
@Data
@Table(name = "notifications", schema = "logging-platform")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User recipient; // The user who should receive this notification

    @Column(name = "message")
    private String message; // The content of the notification, e.g., "High error rate detected for App X"

    @Column(name = "is_read")
    private boolean isRead = false; // To track if the user has seen it

    @CreationTimestamp
    @Column(name = "created_at")
    private Timestamp createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_id")
    private Alert triggeringAlert;
}
