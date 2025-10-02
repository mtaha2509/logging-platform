package com.example.backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;
import java.time.Instant;

@Entity
@Data
@Table(name="logs", schema = "logging-platform")
public class Logs {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "logs_seq")
    @SequenceGenerator(name = "logs_seq", sequenceName = "logs_seq", allocationSize = 50)
    private Long id;

    // Using Timestamp for now (compatible with existing DB)
    // Hibernate will handle UTC conversion via time_zone: UTC setting
    @Column(name = "timestamp")
    private Timestamp timestamp;

    @Column(name="level")
    private String level;

    @Column(name="message")
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private Application application;

}
