package com.example.backend.entities;

import jakarta.persistence.*;
import java.sql.Timestamp;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Data
@Table(name="registered_applications",schema = "logging-platform")
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="description")
    private String description;

    @Column(name = "updatedat")
    private Timestamp updatedAt;

    @Column(name = "name")
    private String name;

    @Column(name="isactive")
    private Boolean isActive = true;
}
