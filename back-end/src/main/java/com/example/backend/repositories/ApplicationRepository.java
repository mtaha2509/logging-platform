package com.example.backend.repositories;

import com.example.backend.entities.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long>, JpaSpecificationExecutor<Application> {
    Optional<Application> findByName(String name);

    Optional<Application> findById(Long id);
    
    // Method to find duplicate application names excluding a specific application ID (for updates)
    Optional<Application> findByNameAndIdNot(String name, Long excludeId);

    List<Application> findAllByIdInOrderByUpdatedAtDesc(List<Long> ids);

}
