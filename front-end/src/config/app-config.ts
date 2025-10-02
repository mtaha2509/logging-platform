/**
 * Application Configuration
 * Single source of truth for all application configurations
 */

// Environment detection
export const getEnvironment = (): 'development' | 'test' | 'production' => {
  // Check for explicit environment variable first
  if (typeof window !== 'undefined' && (window as any).process?.env?.NODE_ENV) {
    return (window as any).process.env.NODE_ENV as 'development' | 'test' | 'production';
  }
  
  // Fallback to hostname detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    if (hostname.includes('test') || hostname.includes('staging')) {
      return 'test';
    }
    return 'production';
  }
  
  return 'development';
};

// Environment variable helpers
export const getEnvVar = (key: string, defaultValue: string): string => {
  if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) {
    return (window as any).process.env[key]!;
  }
  return defaultValue;
};

export const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = getEnvVar(key, defaultValue.toString());
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = getEnvVar(key, defaultValue.toString());
  return value.toLowerCase() === 'true';
};

// Configuration interface
export interface AppConfig {
  environment: 'development' | 'test' | 'production';
  api: {
    baseUrl: string;
    timeout: number;
    endpoints: {
      auth: {
        user: string;
        login: string;
        logout: string;
      };
      applications: string;
      users: string;
      logs: string;
      alerts: string;
      notifications: string;
      visualizations: string;
    };
  };
  features: {
    enableDebugLogs: boolean;
    enableMockData: boolean;
    enableAnalytics: boolean;
  };
  ui: {
    theme: string;
    defaultPageSize: number;
    maxPageSize: number;
  };
}

// Environment-specific configurations
const configs: Record<string, Partial<AppConfig>> = {
  development: {
    api: {
      baseUrl: getEnvVar('REACT_APP_API_BASE_URL', 'http://localhost:8080'),
      timeout: getEnvNumber('REACT_APP_API_TIMEOUT', 30000),
      endpoints: {
        auth: {
          user: '/api/auth/user',
          login: '/oauth2/authorization/google',
          logout: '/logout'
        },
        applications: '/applications',
        users: '/users',
        logs: '/logs',
        alerts: '/alerts',
        notifications: '/notifications',
        visualizations: '/logs/analysis'
      }
    },
    features: {
      enableDebugLogs: getEnvBoolean('REACT_APP_ENABLE_DEBUG_LOGS', true),
      enableMockData: getEnvBoolean('REACT_APP_ENABLE_MOCK_DATA', true),
      enableAnalytics: getEnvBoolean('REACT_APP_ENABLE_ANALYTICS', false)
    },
    ui: {
      theme: getEnvVar('REACT_APP_THEME', 'redwood'),
      defaultPageSize: getEnvNumber('REACT_APP_DEFAULT_PAGE_SIZE', 20),
      maxPageSize: getEnvNumber('REACT_APP_MAX_PAGE_SIZE', 100)
    }
  },
  
  test: {
    api: {
      baseUrl: getEnvVar('REACT_APP_API_BASE_URL', 'http://localhost:8081'),
      timeout: getEnvNumber('REACT_APP_API_TIMEOUT', 15000),
      endpoints: {
        auth: {
          user: '/api/auth/user',
          login: '/oauth2/authorization/google',
          logout: '/logout'
        },
        applications: '/applications',
        users: '/users',
        logs: '/logs',
        alerts: '/alerts',
        notifications: '/notifications',
        visualizations: '/logs/analysis'
      }
    },
    features: {
      enableDebugLogs: getEnvBoolean('REACT_APP_ENABLE_DEBUG_LOGS', true),
      enableMockData: getEnvBoolean('REACT_APP_ENABLE_MOCK_DATA', true),
      enableAnalytics: getEnvBoolean('REACT_APP_ENABLE_ANALYTICS', false)
    },
    ui: {
      theme: getEnvVar('REACT_APP_THEME', 'redwood'),
      defaultPageSize: getEnvNumber('REACT_APP_DEFAULT_PAGE_SIZE', 10),
      maxPageSize: getEnvNumber('REACT_APP_MAX_PAGE_SIZE', 50)
    }
  },
  
  production: {
    api: {
      baseUrl: getEnvVar('REACT_APP_API_BASE_URL', 'https://api.logging-platform.com'),
      timeout: getEnvNumber('REACT_APP_API_TIMEOUT', 10000),
      endpoints: {
        auth: {
          user: '/api/auth/user',
          login: '/oauth2/authorization/google',
          logout: '/logout'
        },
        applications: '/applications',
        users: '/users',
        logs: '/logs',
        alerts: '/alerts',
        notifications: '/notifications',
        visualizations: '/logs/analysis'
      }
    },
    features: {
      enableDebugLogs: getEnvBoolean('REACT_APP_ENABLE_DEBUG_LOGS', false),
      enableMockData: getEnvBoolean('REACT_APP_ENABLE_MOCK_DATA', false),
      enableAnalytics: getEnvBoolean('REACT_APP_ENABLE_ANALYTICS', true)
    },
    ui: {
      theme: getEnvVar('REACT_APP_THEME', 'redwood'),
      defaultPageSize: getEnvNumber('REACT_APP_DEFAULT_PAGE_SIZE', 25),
      maxPageSize: getEnvNumber('REACT_APP_MAX_PAGE_SIZE', 100)
    }
  }
};

// Default configuration
const defaultConfig: AppConfig = {
  environment: 'development',
  api: {
    baseUrl: 'http://localhost:8080',
    timeout: 30000,
    endpoints: {
      auth: {
        user: '/api/auth/user',
        login: '/oauth2/authorization/google',
        logout: '/logout'
      },
      applications: '/applications',
      users: '/users',
      logs: '/logs',
      alerts: '/alerts',
      notifications: '/notifications',
      visualizations: '/logs/analysis'
    }
  },
  features: {
    enableDebugLogs: true,
    enableMockData: true,
    enableAnalytics: false
  },
  ui: {
    theme: 'redwood',
    defaultPageSize: 20,
    maxPageSize: 100
  }
};

// Merge environment-specific config with defaults
const createConfig = (): AppConfig => {
  const environment = getEnvironment();
  const envConfig = configs[environment] || {};
  
  return {
    ...defaultConfig,
    ...envConfig,
    environment,
    api: {
      ...defaultConfig.api,
      ...envConfig.api,
      endpoints: {
        ...defaultConfig.api.endpoints,
        ...envConfig.api?.endpoints
      }
    },
    features: {
      ...defaultConfig.features,
      ...envConfig.features
    },
    ui: {
      ...defaultConfig.ui,
      ...envConfig.ui
    }
  };
};

// Export the configuration instance
export const config = createConfig();

// Export utility functions
export const isDevelopment = (): boolean => config.environment === 'development';
export const isTest = (): boolean => config.environment === 'test';
export const isProduction = (): boolean => config.environment === 'production';

// Export API URL builder
export const buildApiUrl = (endpoint: string): string => {
  return `${config.api.baseUrl}${endpoint}`;
};

// Export auth URL builder
export const buildAuthUrl = (endpoint: keyof AppConfig['api']['endpoints']['auth']): string => {
  return `${config.api.baseUrl}${config.api.endpoints.auth[endpoint]}`;
};

// Debug logging utility
export const debugLog = (message: string, data?: any): void => {
  if (config.features.enableDebugLogs) {
    console.log(`[${config.environment.toUpperCase()}] ${message}`, data || '');
  }
};

// Configuration validation
export const validateConfig = (): boolean => {
  try {
    if (!config.api.baseUrl) {
      throw new Error('API base URL is required');
    }
    
    if (!config.api.endpoints.auth.user) {
      throw new Error('Auth user endpoint is required');
    }
    
    if (config.api.timeout <= 0) {
      throw new Error('API timeout must be positive');
    }
    
    debugLog('Configuration validation passed');
    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
};

// Initialize configuration validation
validateConfig();

