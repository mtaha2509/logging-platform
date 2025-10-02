package com.example.backend.repositories;

import com.example.backend.entities.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
    List<Permission> findByUserIdAndStatus(Long userId, String status);
    List<Permission> findByApplicationIdAndStatus(Long appId, String status);
    List<Permission> findByUserIdInAndApplicationIdIn(List<Long> userIds, List<Long> appIds);
    List<Permission> findByApplicationId(Long appId);
    @Query("select p from Permission p " +
            "join fetch p.user u " +
            "join fetch p.application a " +
            "where p.application.id in :appIds and p.status = 'ACTIVE'")
    List<Permission> findActiveByApplicationIdIn(@Param("appIds") Collection<Long> appIds);

    @Query("select p from Permission p " +
            "join fetch p.user u " +
            "join fetch p.application a " +
            "where p.user.id in :userIds and p.status = 'ACTIVE'")
    List<Permission> findActiveByUserIdIn(@Param("userIds") Collection<Long> userIds);

    Optional<Permission> findByUserIdAndApplicationIdAndStatus(Long userId, Long appId, String status);

}