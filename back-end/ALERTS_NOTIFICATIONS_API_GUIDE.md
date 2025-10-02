# Alerts & Notifications API Guide for Frontend Team

## Overview

This document provides comprehensive guidance for implementing the Alerts and Notifications UI in the centralized logging platform. The system allows administrators to create alerts that monitor log patterns, and automatically notifies users when alerts are triggered.

## User Flow Summary

1. **Admin creates alerts** for specific applications with thresholds
2. **System monitors logs** and evaluates alerts every 60 seconds
3. **When alert triggers**, notifications are sent to all users with permissions on that application
4. **Users receive notifications** and can mark them as read

---

## Authentication & Authorization

### Required Headers
All API calls require proper authentication. Use the existing OAuth2 authentication flow.

### Role Requirements
- **Alert Creation**: Admin role only (`ROLE_ADMIN`)
- **Notification Access**: Any authenticated user (can only see their own notifications)

---

## Alerts API

### 1. Create Alert (Admin Only)

**Endpoint:** `POST /alerts`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "applicationId": 1,
  "severityLevel": "ERROR",
  "count": 10,
  "timeWindow": "PT5M"
}
```

**Field Descriptions:**
- `applicationId`: ID of the application to monitor
- `severityLevel`: Log level to monitor (`ERROR`, `WARN`, `INFO`, `DEBUG`)
- `count`: Threshold number of logs that trigger the alert
- `timeWindow`: Time window in ISO 8601 duration format
  - `PT5M` = 5 minutes
  - `PT1H` = 1 hour
  - `PT30S` = 30 seconds

**Response (201 Created):**
```json
{
  "id": 123,
  "createdAt": "2025-01-24T14:25:43Z",
  "count": 10,
  "timeWindow": "PT5M",
  "level": "ERROR",
  "createdBy": {
    "id": 1,
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "application": {
    "id": 1,
    "name": "Payment Service",
    "description": "Handles payment processing"
  }
}
```

**Error Responses:**
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Application not found
- `400 Bad Request`: Invalid request data

### 2. Get User's Alerts

**Endpoint:** `GET /alerts?userId={userId}`

**Authentication:** Required

**Response (200 OK):**
```json
[
  {
    "id": 123,
    "createdAt": "2025-01-24T14:25:43Z",
    "count": 10,
    "timeWindow": "PT5M",
    "level": "ERROR",
    "createdBy": {
      "id": 1,
      "email": "admin@example.com",
      "role": "ADMIN"
    },
    "application": {
      "id": 1,
      "name": "Payment Service",
      "description": "Handles payment processing"
    }
  }
]
```

---

## Notifications API

### 1. Get User Notifications

**Endpoint:** `GET /notifications?page=0&size=20`

**Authentication:** Required

**Query Parameters:**
- `page`: Page number (default: 0)
- `size`: Page size (default: 20)

**Response (200 OK):**
```json
{
  "content": [
    {
      "id": 456,
      "userId": 2,
      "message": "Alert for 'Payment Service': Found 15 logs with level 'ERROR', exceeding the threshold of 10.",
      "isRead": false,
      "createdAt": "2025-01-24T14:30:15Z"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 5,
  "totalPages": 1,
  "first": true,
  "last": true
}
```

### 2. Mark Notification as Read

**Endpoint:** `POST /notifications/{notificationId}/read`

**Authentication:** Required

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found`: Notification not found
- `403 Forbidden`: User doesn't own this notification

---

## Frontend Implementation Guide

### 1. Alert Creation Form (Admin Only)

**Required Form Fields:**
```typescript
interface CreateAlertForm {
  applicationId: number;
  severityLevel: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  count: number;
  timeWindow: string; // ISO 8601 duration
}
```

**Time Window Helper:**
```typescript
const timeWindowOptions = [
  { label: '30 seconds', value: 'PT30S' },
  { label: '1 minute', value: 'PT1M' },
  { label: '5 minutes', value: 'PT5M' },
  { label: '15 minutes', value: 'PT15M' },
  { label: '30 minutes', value: 'PT30M' },
  { label: '1 hour', value: 'PT1H' },
  { label: '2 hours', value: 'PT2H' },
  { label: '6 hours', value: 'PT6H' },
  { label: '12 hours', value: 'PT12H' },
  { label: '24 hours', value: 'PT24H' }
];
```

**Form Validation:**
- Application ID: Required, must be positive
- Severity Level: Required, must be valid enum
- Count: Required, must be positive integer
- Time Window: Required, must be valid ISO 8601 duration

### 2. Alerts List Page

**Features to Implement:**
- Display all alerts created by the current user
- Show alert details: application name, severity, threshold, time window
- Filter by application or severity level
- Edit/Delete functionality (if needed)

### 3. Notifications Component

**Key Features:**
- **Notification Bell Icon**: Show unread count
- **Dropdown/Panel**: List recent notifications
- **Mark as Read**: Click to mark individual notifications as read
- **Pagination**: Load more notifications
- **Real-time Updates**: Consider WebSocket or polling for new notifications

**Notification DTO:**
```typescript
interface NotificationDto {
  id: number;
  userId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}
```

**Sample Notification Component:**
```jsx
const NotificationItem = ({ notification, onMarkAsRead }) => (
  <div className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}>
    <div className="notification-content">
      <p className="notification-message">{notification.message}</p>
      <span className="notification-time">
        {formatDistanceToNow(new Date(notification.createdAt))} ago
      </span>
    </div>
    {!notification.isRead && (
      <button 
        onClick={() => onMarkAsRead(notification.id)}
        className="mark-read-btn"
      >
        Mark as Read
      </button>
    )}
  </div>
);
```

### 4. Integration with Existing Pages

**Dashboard Integration:**
- Add notification bell to header
- Show recent alerts summary
- Display notification count

**Applications Page:**
- Add "Create Alert" button for each application (admin only)
- Show existing alerts for each application

**Users Page (Admin):**
- Show which users will receive notifications for each application
- Based on user permissions/assignments

---

## Error Handling

### Standard Error Response Format
```json
{
  "timestamp": "2025-01-24T14:25:43Z",
  "status": 403,
  "error": "Access Denied",
  "message": "You do not have permission to access this resource",
  "path": "/alerts",
  "traceId": "abc123-def456-ghi789"
}
```

### Frontend Error Handling
```typescript
const handleApiError = (error: ApiError) => {
  switch (error.status) {
    case 403:
      showError('You do not have permission to perform this action');
      break;
    case 404:
      showError('Resource not found');
      break;
    case 409:
      showError(error.message); // Meaningful duplicate messages
      break;
    default:
      showError('An unexpected error occurred');
  }
};
```

---

## Real-time Notifications (Optional Enhancement)

### WebSocket Integration
Consider implementing WebSocket connection for real-time notification delivery:

**Connection:** `ws://localhost:8080/ws/notifications`

**Message Format:**
```json
{
  "type": "NEW_NOTIFICATION",
  "data": {
    "id": 789,
    "message": "Alert for 'User Service': Found 25 logs with level 'ERROR', exceeding the threshold of 20.",
    "createdAt": "2025-01-24T14:35:00Z",
    "applicationName": "User Service"
  }
}
```

### Polling Alternative
If WebSocket is not implemented, poll for new notifications every 30-60 seconds:

```typescript
const pollNotifications = async () => {
  try {
    const response = await fetch('/notifications?page=0&size=5');
    const data = await response.json();
    updateNotificationCount(data.content.filter(n => !n.isRead).length);
  } catch (error) {
    console.error('Failed to poll notifications:', error);
  }
};

// Poll every 30 seconds
setInterval(pollNotifications, 30000);
```

---

## Testing Scenarios

### 1. Alert Creation Testing
- Test with valid admin user
- Test with non-admin user (should fail)
- Test with invalid application ID
- Test with invalid time window format

### 2. Notification Flow Testing
- Create alert with low threshold
- Generate logs that exceed threshold
- Verify notifications appear for users with app permissions
- Test marking notifications as read

### 3. Permission Testing
- Verify users only see notifications for apps they have access to
- Test that users can only mark their own notifications as read

---

## UI/UX Recommendations

### Visual Design
- **Unread notifications**: Bold text, colored indicator
- **Alert severity colors**: 
  - ERROR: Red
  - WARN: Orange
  - INFO: Blue
  - DEBUG: Gray
- **Time windows**: Display in human-readable format (e.g., "5 minutes" instead of "PT5M")

### User Experience
- **Confirmation dialogs**: For alert creation and deletion
- **Loading states**: Show spinners during API calls
- **Empty states**: Friendly messages when no alerts/notifications exist
- **Responsive design**: Ensure mobile compatibility

### Accessibility
- **Screen reader support**: Proper ARIA labels
- **Keyboard navigation**: Tab through notifications
- **High contrast**: Support for accessibility themes

---

## Sample Implementation Checklist

- [ ] Create alert form (admin only)
- [ ] Alerts list page
- [ ] Notification bell component
- [ ] Notification dropdown/panel
- [ ] Mark as read functionality
- [ ] Pagination for notifications
- [ ] Error handling for all API calls
- [ ] Loading states
- [ ] Responsive design
- [ ] Integration with existing auth system
- [ ] Real-time updates (WebSocket or polling)
- [ ] Testing with different user roles

---

This guide provides everything needed to implement a complete alerts and notifications system in your frontend. The backend APIs are fully compatible with your existing authentication and error handling patterns.
