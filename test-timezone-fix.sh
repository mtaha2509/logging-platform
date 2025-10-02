#!/bin/bash

# Test script for timezone fix verification
# Current time: 2025-10-02 11:30 AM PKT (UTC+5)

echo "=== Timezone Fix Test Script ==="
echo "Current time: $(date)"
echo "Current time UTC: $(date -u)"
echo ""

# Wait for backend to be ready
echo "Waiting for backend to start on port 8080..."
timeout=60
elapsed=0
while ! nc -z localhost 8080; do
    sleep 1
    elapsed=$((elapsed + 1))
    if [ $elapsed -ge $timeout ]; then
        echo "ERROR: Backend did not start within $timeout seconds"
        exit 1
    fi
done
echo "✓ Backend is ready"
echo ""

# Test 1: Last 24 hours query (should return recent logs)
echo "=== Test 1: Last 24 hours query ==="
echo "Expected: Should return logs from 2025-10-02 11:13:48"
echo ""

# Calculate 24 hours ago in UTC
FROM_UTC=$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S)
TO_UTC=$(date -u +%Y-%m-%dT%H:%M:%S)

echo "Query parameters:"
echo "  from: $FROM_UTC (UTC)"
echo "  to: $TO_UTC (UTC)"
echo ""

# Make the API call (you'll need to add authentication token if required)
curl -s "http://localhost:8080/logs?from=${FROM_UTC}&to=${TO_UTC}&page=0&size=20&sort=timestamp,desc" \
    -H "Accept: application/json" | jq '.' > /tmp/test1_result.json

echo "Response saved to /tmp/test1_result.json"
echo "Total elements: $(jq '.totalElements' /tmp/test1_result.json)"
echo ""

# Test 2: Custom range 10 AM to 12 PM PKT
echo "=== Test 2: Custom range 10:00 AM to 12:00 PM PKT ==="
echo "Expected: Should return logs from 2025-10-02 11:13:48"
echo ""

# 10:00 AM PKT = 05:00 AM UTC
# 12:00 PM PKT = 07:00 AM UTC
FROM_CUSTOM="2025-10-02T05:00:00"
TO_CUSTOM="2025-10-02T07:00:00"

echo "Query parameters:"
echo "  from: $FROM_CUSTOM (UTC = 10:00 AM PKT)"
echo "  to: $TO_CUSTOM (UTC = 12:00 PM PKT)"
echo ""

curl -s "http://localhost:8080/logs?from=${FROM_CUSTOM}&to=${TO_CUSTOM}&page=0&size=20&sort=timestamp,desc" \
    -H "Accept: application/json" | jq '.' > /tmp/test2_result.json

echo "Response saved to /tmp/test2_result.json"
echo "Total elements: $(jq '.totalElements' /tmp/test2_result.json)"
echo ""

# Test 3: Check specific log entries
echo "=== Test 3: Verify specific log timestamps ==="
echo "First few log timestamps from Test 2:"
jq '.content[] | {id, timestamp, level, message}' /tmp/test2_result.json | head -20
echo ""

echo "=== Tests Complete ==="
echo ""
echo "Manual verification steps:"
echo "1. Check that Test 2 returns logs with timestamps around 2025-10-02 11:13:48"
echo "2. Verify timestamps in the response match the expected time range"
echo "3. Open frontend and test the same queries visually"
