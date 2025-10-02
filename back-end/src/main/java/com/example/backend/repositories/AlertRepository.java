package com.example.backend.repositories;

import com.example.backend.entities.Alert;
import com.example.backend.entities.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByCreatedById(Long userId);
    Page<Alert> findAllByOrderByUpdatedAtDesc(Pageable pageable);
    
    // Method to find duplicate alerts (same application, level, count, and timeWindow)
    Optional<Alert> findByApplicationAndLevelAndCountAndTimeWindow(
        Application application, String level, Integer count, Duration timeWindow);

    // Method to find duplicate alerts excluding a specific alert ID (for updates)
    Optional<Alert> findByApplicationAndLevelAndCountAndTimeWindowAndIdNot(
        Application application, String level, Integer count, Duration timeWindow, Long excludeId);
}
