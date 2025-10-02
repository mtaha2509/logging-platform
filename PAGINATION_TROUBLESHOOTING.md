# 🔧 Pagination & Sorting Troubleshooting Guide

## ✅ Changes Made to Fix Issues

### **1. Backend - Added @EnableSpringDataWebSupport**

**File:** `PaginationConfig.java`

**Problem:** Spring Data Web support wasn't explicitly enabled.

**Fix:**
```java
@Configuration
@EnableSpringDataWebSupport  // ← Added this
public class PaginationConfig implements WebMvcConfigurer {
    // ...
}
```

---

### **2. Frontend - Added sort parameter to searchLogs**

**File:** `api.ts`

**Problem:** Logs API wasn't sending sort parameter.

**Fix:**
```typescript
if (params.sort) queryParams.append('sort', params.sort);  // ← Added this line
```

---

### **3. Backend - Added logging to AlertController**

**File:** `AlertController.java`

**Added:**
```java
logger.info("Query string: {}", httpRequest.getQueryString());
```

This helps debug what parameters are actually being received.

---

## 🧪 How to Test

### **Test 1: Check Backend Logs**

Start your backend and watch the logs:

```bash
cd back-end
mvn spring-boot:run
```

When you load the Alerts page, you should see:
```
Received request to list alerts - page=0, size=20, sort=updatedAt: DESC
Query string: page=0&size=20&sort=updatedAt,desc
```

**What to look for:**
- ✅ `size=20` (from config)
- ✅ `sort=updatedAt,desc` (from frontend)
- ❌ If you see `size=10` → Config not applied
- ❌ If sort is empty → Frontend not sending it

---

### **Test 2: Check Frontend Network Tab**

1. Open browser DevTools (F12)
2. Go to Network tab
3. Load Alerts page
4. Look for request to `/alerts`

**Expected URL:**
```
http://localhost:8080/alerts?page=0&size=20&sort=updatedAt,desc
```

**If you see:**
- ❌ `size=10` → Frontend using old default
- ❌ No `sort` parameter → Frontend not sending it
- ✅ `size=20&sort=updatedAt,desc` → Correct!

---

### **Test 3: Test Sorting**

1. Go to Alerts page
2. Click "Sort by Updated" button
3. Check Network tab

**Expected:**
- First click: `sort=updatedAt,asc` (Oldest First)
- Second click: `sort=updatedAt,desc` (Newest First)

---

### **Test 4: Test Page Size Change**

1. Go to Alerts page
2. Click page size dropdown
3. Select "50"
4. Check Network tab

**Expected:**
```
/alerts?page=0&size=50&sort=updatedAt,desc
```

**Verify:**
- ✅ Returns 50 items (or less if fewer exist)
- ✅ Resets to page 0
- ✅ Maintains sort order

---

## 🐛 Common Issues & Solutions

### **Issue 1: Page size still 10 instead of 20**

**Symptoms:**
- Frontend shows 10 items
- Network tab shows `size=10`

**Causes:**
1. Frontend state not updated
2. Backend config not loaded

**Solutions:**

**A. Check Frontend State:**
```typescript
// In alerts.tsx, line 51
const [pageSize, setPageSize] = useState(20);  // Should be 20, not 10
```

**B. Verify Backend Config:**
```bash
# Check application.yml
cat back-end/src/main/resources/application.yml | grep -A 2 pagination
```

Should show:
```yaml
pagination:
  default-page-size: 20
  max-page-size: 100
```

**C. Restart Backend:**
```bash
# Stop backend (Ctrl+C)
# Start again
mvn spring-boot:run
```

---

### **Issue 2: Sorting not working**

**Symptoms:**
- Click sort button
- Data order doesn't change
- Network tab shows no `sort` parameter

**Causes:**
1. Frontend not sending sort
2. Backend not applying sort

**Solutions:**

**A. Check Frontend Sends Sort:**
```typescript
// In logs.tsx, verify this line exists (line 286)
sort: `timestamp,${sortOrder}`

// In api.ts, verify this line exists (line 281)
if (params.sort) queryParams.append('sort', params.sort);
```

**B. Check Backend Applies Sort:**
```java
// In AlertService.java, should use:
return alertRepository.findAll(pageable);  // ✅ Respects sort

// NOT:
return alertRepository.findAllByOrderByUpdatedAtDesc(pageable);  // ❌ Ignores sort
```

**C. Check Backend Logs:**
```
Received request to list alerts - page=0, size=20, sort=updatedAt: DESC
```

If sort shows as empty, frontend isn't sending it.

---

### **Issue 3: Max page size not enforced**

**Symptoms:**
- Can request `size=500`
- Backend returns 500 items

**Causes:**
1. PaginationConfig not loaded
2. Validator not using config

**Solutions:**

**A. Verify Config is Loaded:**
Add to `PaginationConfig.java`:
```java
@PostConstruct
public void init() {
    System.out.println("✅ PaginationConfig loaded: defaultSize=" + defaultPageSize + ", maxSize=" + maxPageSize);
}
```

**B. Check Validator:**
```java
// PageableValidator.java should have:
@Autowired(required = false)
private PaginationConfig paginationConfig;
```

**C. Test Max Size:**
```bash
curl "http://localhost:8080/alerts?size=200"
```

Should return 400 Bad Request with error: "Page size must not exceed 100"

---

### **Issue 4: Sort direction reversed**

**Symptoms:**
- "Newest First" shows oldest
- "Oldest First" shows newest

**Cause:**
Frontend sending opposite direction

**Solution:**

Check `SortButton.tsx`:
```typescript
// Should toggle correctly
onSortChange(currentSort === 'asc' ? 'desc' : 'asc');
```

Check labels match direction:
```typescript
{currentSort === 'desc' ? 'Newest First' : 'Oldest First'}
```

---

## 🔍 Debug Checklist

### **Backend:**
- [ ] `PaginationConfig.java` has `@EnableSpringDataWebSupport`
- [ ] `application.yml` has pagination config
- [ ] `AlertService.java` uses `findAll(pageable)` not `findAllByOrderByUpdatedAtDesc`
- [ ] Backend logs show correct page, size, sort
- [ ] Backend restarts after config changes

### **Frontend:**
- [ ] `alerts.tsx` default pageSize is 20
- [ ] `alerts.tsx` has sortOrder state
- [ ] `api.ts` sends sort parameter for logs
- [ ] `api.ts` sends sort parameter for alerts
- [ ] Network tab shows correct parameters
- [ ] Browser cache cleared

---

## 📊 Expected vs Actual

### **Alerts Page - First Load**

**Expected Request:**
```
GET /alerts?page=0&size=20&sort=updatedAt,desc
```

**Expected Response:**
```json
{
  "content": [...],  // 20 items (or less)
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 245,
  "totalPages": 13,
  "sort": {
    "sorted": true,
    "orders": [
      {
        "property": "updatedAt",
        "direction": "DESC"
      }
    ]
  }
}
```

---

### **Logs Page - With Sorting**

**Expected Request:**
```
GET /logs?page=0&size=20&sort=timestamp,desc&from=2025-10-01T00:00:00&to=2025-10-02T00:00:00
```

**Expected Response:**
```json
{
  "content": [...],  // Sorted by timestamp DESC
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "sorted": true
    }
  }
}
```

---

## 🚀 Quick Fix Commands

### **Reset Everything:**

```bash
# Backend
cd back-end
mvn clean install
mvn spring-boot:run

# Frontend (in new terminal)
cd front-end
npm install
npm run serve

# Clear browser cache
# Chrome: Ctrl+Shift+Delete → Clear cached images and files
```

---

### **Verify Configuration:**

```bash
# Check backend config
cat back-end/src/main/resources/application.yml | grep -A 3 pagination

# Check if PaginationConfig exists
ls -la back-end/src/main/java/com/example/backend/config/PaginationConfig.java

# Check AlertService
grep -A 3 "getAllAlerts" back-end/src/main/java/com/example/backend/services/AlertService.java
```

---

## 📝 Testing Script

Save as `test-pagination.sh`:

```bash
#!/bin/bash

echo "Testing Pagination & Sorting..."
echo ""

echo "1. Test default pagination:"
curl -s "http://localhost:8080/alerts" | jq '.pageable'

echo ""
echo "2. Test custom page size:"
curl -s "http://localhost:8080/alerts?size=50" | jq '.pageable.pageSize'

echo ""
echo "3. Test sorting ASC:"
curl -s "http://localhost:8080/alerts?sort=updatedAt,asc" | jq '.sort'

echo ""
echo "4. Test sorting DESC:"
curl -s "http://localhost:8080/alerts?sort=updatedAt,desc" | jq '.sort'

echo ""
echo "5. Test max size enforcement (should fail):"
curl -s "http://localhost:8080/alerts?size=200" | jq '.status'
```

Run with:
```bash
chmod +x test-pagination.sh
./test-pagination.sh
```

---

## ✅ Success Indicators

You'll know it's working when:

1. **Backend logs show:**
   ```
   Received request to list alerts - page=0, size=20, sort=updatedAt: DESC
   ```

2. **Network tab shows:**
   ```
   /alerts?page=0&size=20&sort=updatedAt,desc
   ```

3. **Response includes:**
   ```json
   {
     "pageable": { "pageSize": 20 },
     "sort": { "sorted": true }
   }
   ```

4. **UI shows:**
   - 20 items per page (default)
   - Sort button toggles between "Newest First" / "Oldest First"
   - Page size dropdown works
   - Data order changes when sorting

---

## 🆘 Still Not Working?

If pagination/sorting still doesn't work after all fixes:

1. **Check Spring Boot version:**
   ```xml
   <!-- pom.xml -->
   <parent>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-parent</artifactId>
       <version>3.x.x</version>  <!-- Should be 3.x -->
   </parent>
   ```

2. **Verify Spring Data Web dependency:**
   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-data-jpa</artifactId>
   </dependency>
   ```

3. **Check for conflicting configurations:**
   ```bash
   grep -r "PageableHandlerMethodArgumentResolver" back-end/src/
   ```
   Should only appear in `PaginationConfig.java`

4. **Enable debug logging:**
   ```yaml
   # application.yml
   logging:
     level:
       org.springframework.data.web: DEBUG
       com.example.backend: DEBUG
   ```

---

**After applying all fixes, restart both backend and frontend, then test!** 🚀
