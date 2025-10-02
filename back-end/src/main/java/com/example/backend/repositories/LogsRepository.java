package com.example.backend.repositories;

import com.example.backend.entities.Application;
import com.example.backend.entities.Logs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.sql.Timestamp;
import java.util.List;

public interface LogsRepository extends JpaRepository<Logs, Long>, JpaSpecificationExecutor<Logs>{
    Page<Logs> findByApplicationId(Long appId, Pageable pageable);

    @Query(value =
            "SELECT date_trunc(:unit, l.timestamp) AS time, l.level AS level, COUNT(l.id) AS count " +
                    "FROM \"logging-platform\".logs l " +
                    "WHERE l.application_id IN (:appIds) " +
                    "  AND l.timestamp >= :from AND l.timestamp <= :to " +
                    "GROUP BY 1, 2 " +
                    "ORDER BY 1, 2",
            nativeQuery = true)
    List<Object[]> getLogTrendsForApps(@Param("unit") String unit,
                                       @Param("appIds") List<Long> appIds,
                                       @Param("from") Timestamp from,
                                       @Param("to") Timestamp to);


    /**
     * Trends for ALL applications (no app filter).
     * - Use when caller intends aggregated results across all apps (appIds == null).
     */
    @Query(value =
            "SELECT date_trunc(:unit, l.timestamp) AS time, l.level AS level, COUNT(l.id) AS count " +
                    "FROM \"logging-platform\".logs l " +
                    "WHERE l.timestamp >= :from AND l.timestamp <= :to " +
                    "GROUP BY 1, 2 " +
                    "ORDER BY 1, 2",
            nativeQuery = true)
    List<Object[]> getLogTrendsAllApps(@Param("unit") String unit,
                                       @Param("from") Timestamp from,
                                       @Param("to") Timestamp to);


    /**
     * Summary for a specific set of app IDs.
     * - Caller must provide a non-empty appIds list.
     * Returns rows: (level TEXT, count BIGINT)
     */
    @Query(value =
            "SELECT l.level AS level, COUNT(l.id) AS count " +
                    "FROM \"logging-platform\".logs l " +
                    "WHERE l.application_id IN (:appIds) " +
                    "  AND l.timestamp >= :from AND l.timestamp <= :to " +
                    "GROUP BY l.level " +
                    "ORDER BY l.level",
            nativeQuery = true)
    List<Object[]> getLogSummaryForApps(@Param("appIds") List<Long> appIds,
                                        @Param("from") Timestamp from,
                                        @Param("to") Timestamp to);


    /**
     * Summary across ALL applications (no app filter).
     */
    @Query(value =
            "SELECT l.level AS level, COUNT(l.id) AS count " +
                    "FROM \"logging-platform\".logs l " +
                    "WHERE l.timestamp >= :from AND l.timestamp <= :to " +
                    "GROUP BY l.level " +
                    "ORDER BY l.level",
            nativeQuery = true)
    List<Object[]> getLogSummaryAllApps(@Param("from") Timestamp from,
                                        @Param("to") Timestamp to);
    long countByApplicationAndLevelAndTimestampAfter(Application application, String level, Timestamp timestamp);
}
