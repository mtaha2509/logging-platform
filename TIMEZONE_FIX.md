# Timezone Issue Fix - Log Ingestion and Query

## Problem Summary

**Issue**: Logs stored in PostgreSQL were not appearing in the frontend despite being correctly stored in the database.

**Root Cause**: Timezone mismatch between frontend UTC timestamps and backend LocalDateTime parsing.

## Detailed Analysis

### The Flow
1. **Redpanda** sends logs with Unix timestamps (e.g., `1759403628715` milliseconds)
2. **LogConsumer** correctly converts Unix timestamps to UTC and stores in PostgreSQL
3. **PostgreSQL** stores timestamps correctly (e.g., `2025-10-02 11:13:48.715000` in PKT/Asia/Karachi timezone)
4. **Frontend** sends query timestamps in UTC format without 'Z' suffix (e.g., `2025-10-02T06:22:54`)
5. **Backend** was treating these as local time (PKT) instead of UTC, causing a 5-hour offset

### Example of the Issue

**Current Time**: 11:23 AM PKT (UTC+5)
**Database Records**: `2025-10-02 11:13:48` (stored in PKT)

**Frontend Query for Last 24 Hours**:
- From: `2025-10-01T06:22:54` (meaning 6:22 AM UTC = 11:22 AM PKT)
- To: `2025-10-02T06:22:54` (meaning 6:22 AM UTC = 11:22 AM PKT)

**Backend Incorrectly Interpreted**:
- Treated `2025-10-02T06:22:54` as 6:22 AM PKT (not UTC)
- Queried for logs between 6:22 AM PKT yesterday to 6:22 AM PKT today
- Missed logs at 11:13 AM PKT because they're outside this range

**Frontend Query for 10 AM to 12 PM**:
- From: `2025-10-02T05:00:00` (5:00 AM UTC = 10:00 AM PKT)
- To: `2025-10-02T07:00:00` (7:00 AM UTC = 12:00 PM PKT)

**Backend Incorrectly Interpreted**:
- Treated these as 5:00 AM to 7:00 AM PKT
- Queried for logs in that window, missing the 11:13 AM logs

## The Fix

### 1. Backend Changes

#### LogsController.java
- Added documentation that frontend sends UTC timestamps without 'Z' suffix
- Renamed parameters to `fromUtc` and `toUtc` for clarity
- Added logging to show timestamps are received as UTC

#### LogService.java
- Updated `searchLogs` method to explicitly convert UTC `LocalDateTime` to `Instant`
- Uses `ZoneOffset.UTC` to interpret the LocalDateTime values correctly
- Converts to `Timestamp` for database comparison
- Added debug logging to track timestamp conversion

```java
// Before (WRONG - interpreted as local time)
if (startTime != null) {
    preds.add(cb.greaterThanOrEqualTo(root.get("timestamp"), Timestamp.valueOf(startTime)));
}

// After (CORRECT - explicitly treated as UTC)
if (startTimeUtc != null) {
    Instant startInstant = startTimeUtc.toInstant(ZoneOffset.UTC);
    Timestamp startTimestamp = Timestamp.from(startInstant);
    preds.add(cb.greaterThanOrEqualTo(root.get("timestamp"), startTimestamp));
}
```

#### application.yml
- Added `connection-init-sql: SET TIME ZONE 'UTC'` to HikariCP config
- Ensures all database connections use UTC timezone
- Works in conjunction with `hibernate.jdbc.time_zone: UTC`

### 2. How It Works Now

1. Frontend sends: `2025-10-02T06:22:54` (UTC, but without 'Z')
2. Spring Boot receives as `LocalDateTime` (no timezone info)
3. Backend explicitly treats it as UTC: `LocalDateTime.toInstant(ZoneOffset.UTC)`
4. Converts to `Timestamp` which Hibernate stores/compares in UTC
5. Database connection is configured to use UTC timezone
6. Query correctly matches database records

### 3. Timezone Configuration Summary

- **Database Server**: `Asia/Karachi` (PKT, UTC+5) via migration `V17__changeTimeZone.sql`
- **Database Connections**: UTC via HikariCP init SQL
- **Hibernate**: UTC via `hibernate.jdbc.time_zone: UTC`
- **Application Timestamps**: Stored and compared in UTC
- **Frontend Display**: Converts to user's local timezone for display

## Testing the Fix

### Test Case 1: Last 24 Hours Query
**Time**: 11:23 AM PKT (2025-10-02)

**Expected Frontend Request**:
```
from=2025-10-01T06:23:00  (11:23 AM PKT yesterday as UTC)
to=2025-10-02T06:23:00    (11:23 AM PKT today as UTC)
```

**Expected Backend Behavior**:
- Convert to UTC Instant: `2025-10-01T06:23:00Z` to `2025-10-02T06:23:00Z`
- Query should return logs from 11:23 AM PKT yesterday to 11:23 AM PKT today
- Should include logs at `2025-10-02 11:13:48` ✓

### Test Case 2: Custom Range 10 AM to 12 PM (PKT)
**Frontend Request**:
```
from=2025-10-02T05:00:00  (10:00 AM PKT as UTC)
to=2025-10-02T07:00:00    (12:00 PM PKT as UTC)
```

**Expected Backend Behavior**:
- Convert to UTC Instant: `2025-10-02T05:00:00Z` to `2025-10-02T07:00:00Z`
- This equals 10:00 AM to 12:00 PM PKT
- Should include logs at `2025-10-02 11:13:48` ✓

## Verification Steps

1. **Restart the Backend** to apply configuration changes:
   ```bash
   cd /home/muhammadtaha/Desktop/logging-platform/back-end
   ./mvnw spring-boot:run
   ```

2. **Check Backend Logs** for timezone conversion messages:
   ```
   INFO  - Searching logs with filters - from (UTC): 2025-10-02T05:00:00, to (UTC): 2025-10-02T07:00:00
   DEBUG - Converted start time - UTC LocalDateTime: 2025-10-02T05:00:00 -> Instant: 2025-10-02T05:00:00Z -> Timestamp: ...
   ```

3. **Test in Frontend**:
   - Open Logs page
   - Select "Last 24 hours" - should show recent logs
   - Select custom range 10 AM to 12 PM - should show logs in that window

4. **Verify Database Queries** (optional):
   Enable SQL logging in `.env`:
   ```
   JPA_SHOW_SQL=true
   JPA_FORMAT_SQL=true
   ```

## Key Learnings

1. **Never assume timezone** - always explicitly specify when converting between date/time types
2. **ISO 8601 without 'Z'** is ambiguous - document whether it's UTC or local time
3. **LocalDateTime has no timezone** - use `Instant` or `ZonedDateTime` for timezone-aware operations
4. **Database connections need timezone config** - especially when working across timezones
5. **Frontend date pickers** work in user's local timezone - need UTC conversion for API calls

## Files Modified

1. `/back-end/src/main/java/com/example/backend/controllers/LogsController.java`
2. `/back-end/src/main/java/com/example/backend/services/LogService.java`
3. `/back-end/src/main/resources/application.yml`

## Related Configuration

- Database timezone: `V17__changeTimeZone.sql` sets `timezone TO 'Asia/Karachi'`
- Hibernate timezone: `application.yml` has `hibernate.jdbc.time_zone: UTC`
- Frontend timezone handling: `logs.tsx` uses `Date.toISOString()` for UTC conversion
