# Configuration Management Guide

This document describes the centralized configuration management system implemented in the Centralized Logging Platform frontend.

## 🎯 **Overview**

The application now follows a **Single Source of Truth** principle for all configurations, with environment-specific settings and no hardcoded values.

## 📁 **Configuration Structure**

### **1. Centralized Configuration**
- **File**: `src/config/app-config.ts`
- **Purpose**: Single source of truth for all application settings
- **Features**:
  - Environment detection (development/test/production)
  - Environment variable integration
  - Configuration validation
  - Type-safe configuration interface

### **2. Environment Files**
- **`.env`**: Default configuration
- **`.env.development`**: Development environment settings
- **`.env.test`**: Test environment settings  
- **`.env.production`**: Production environment settings

## 🔧 **Configuration Categories**

### **API Configuration**
```typescript
api: {
  baseUrl: string;           // API base URL
  timeout: number;           // Request timeout in ms
  endpoints: {
    auth: {
      user: string;          // User info endpoint
      login: string;         // OAuth login endpoint
      logout: string;        // Logout endpoint
    };
    applications: string;    // Applications endpoint
    users: string;           // Users endpoint
    logs: string;            // Logs endpoint
    alerts: string;          // Alerts endpoint
    notifications: string;   // Notifications endpoint
    visualizations: string;  // Visualizations endpoint
  };
}
```

### **Feature Flags**
```typescript
features: {
  enableDebugLogs: boolean;  // Enable debug logging
  enableMockData: boolean;   // Enable mock data
  enableAnalytics: boolean;  // Enable analytics
}
```

### **UI Configuration**
```typescript
ui: {
  theme: string;             // UI theme
  defaultPageSize: number;   // Default pagination size
  maxPageSize: number;       // Maximum pagination size
}
```

## 🌍 **Environment-Specific Settings**

### **Development Environment**
```bash
# .env.development
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_API_TIMEOUT=30000
REACT_APP_ENABLE_DEBUG_LOGS=true
REACT_APP_ENABLE_MOCK_DATA=true
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_THEME=redwood
REACT_APP_DEFAULT_PAGE_SIZE=20
REACT_APP_MAX_PAGE_SIZE=100
```

### **Test Environment**
```bash
# .env.test
REACT_APP_API_BASE_URL=http://localhost:8081
REACT_APP_API_TIMEOUT=15000
REACT_APP_ENABLE_DEBUG_LOGS=true
REACT_APP_ENABLE_MOCK_DATA=true
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_THEME=redwood
REACT_APP_DEFAULT_PAGE_SIZE=10
REACT_APP_MAX_PAGE_SIZE=50
```

### **Production Environment**
```bash
# .env.production
REACT_APP_API_BASE_URL=https://api.logging-platform.com
REACT_APP_API_TIMEOUT=10000
REACT_APP_ENABLE_DEBUG_LOGS=false
REACT_APP_ENABLE_MOCK_DATA=false
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_THEME=redwood
REACT_APP_DEFAULT_PAGE_SIZE=25
REACT_APP_MAX_PAGE_SIZE=100
```

## 🚀 **Usage Examples**

### **Import Configuration**
```typescript
import { config, buildApiUrl, buildAuthUrl, debugLog } from '../config/app-config';
```

### **Use API URLs**
```typescript
// Instead of hardcoded URLs
const url = buildApiUrl('/applications');
const authUrl = buildAuthUrl('login');
```

### **Access Configuration Values**
```typescript
// API configuration
const baseUrl = config.api.baseUrl;
const timeout = config.api.timeout;

// Feature flags
if (config.features.enableDebugLogs) {
  debugLog('Debug message', data);
}

// UI configuration
const pageSize = config.ui.defaultPageSize;
```

### **Environment Detection**
```typescript
import { isDevelopment, isProduction, isTest } from '../config';

if (isDevelopment()) {
  // Development-specific code
}

if (isProduction()) {
  // Production-specific code
}
```

## 🛠️ **Build Commands**

### **Development**
```bash
npm run start:dev    # Start development server
npm run build:dev    # Build for development
```

### **Test**
```bash
npm run start:test   # Start test server
npm run build:test   # Build for test
```

### **Production**
```bash
npm run build:prod   # Build for production
```

## 🔒 **Security Best Practices**

### **✅ Implemented**
- No hardcoded credentials or secrets
- Environment-specific configuration
- Configuration validation
- Type-safe configuration interface

### **⚠️ Important Notes**
- Environment files (`.env*`) should be added to `.gitignore`
- Production secrets should be managed by deployment system
- Never commit sensitive configuration to version control

## 📊 **Configuration Validation**

The system includes automatic configuration validation:

```typescript
// Validates required configuration on startup
validateConfig(): boolean {
  // Checks for required API URLs
  // Validates timeout values
  // Ensures proper endpoint configuration
}
```

## 🔄 **Migration from Hardcoded Values**

### **Before (❌ Violations)**
```typescript
// Hardcoded API URL
const API_BASE_URL = 'http://localhost:8080';

// Hardcoded endpoints
window.location.href = 'http://localhost:8080/oauth2/authorization/google';
fetch('http://localhost:8080/logout', ...);
```

### **After (✅ Compliant)**
```typescript
// Centralized configuration
import { config, buildAuthUrl } from '../config';

// Dynamic URLs
window.location.href = buildAuthUrl('login');
fetch(buildAuthUrl('logout'), ...);
```

## 🎯 **Compliance Status**

| Criteria | Status | Implementation |
|----------|--------|----------------|
| Single Source of Truth | ✅ | Centralized config system |
| No Hardcoding | ✅ | All URLs use config |
| Environment Separation | ✅ | Environment-specific files |
| Secure Credentials | ✅ | No secrets in code |

## 🚀 **Next Steps**

1. **Deploy Environment Files**: Ensure environment files are properly deployed
2. **Update CI/CD**: Configure build pipelines to use correct environment
3. **Monitor Configuration**: Add configuration monitoring in production
4. **Documentation**: Keep this guide updated with new configuration options

---

**Configuration management is now fully compliant with enterprise standards! 🎉**
