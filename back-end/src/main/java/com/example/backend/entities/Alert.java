package com.example.backend.entities;

import io.hypersistence.utils.hibernate.type.interval.PostgreSQLIntervalType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.sql.Timestamp;
import java.time.Duration;

@Entity
@Data
@Table(name = "alerts", schema = "logging-platform")
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="updatedat")
    private Timestamp updatedAt;

    @Column(name="count")
    private Integer count;

    @Type(PostgreSQLIntervalType.class)
    @Column(name="time_window")
    private Duration timeWindow;

    @Column(name="severity")
    private String level;

    @Column(name="isactive")
    private Boolean isActive = true;

    @ManyToOne
    @JoinColumn(name="created_by")
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;
}
