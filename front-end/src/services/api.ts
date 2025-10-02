import { HttpApiError, ApiError } from './HttpApiError';
import { config, buildApiUrl, buildAuthUrl, debugLog } from '../config/app-config';

export interface User {
  id: number;
  email: string;
  createdAt: string;
  role: 'USER' | 'ADMIN';
}

export interface Application {
  id: number;
  name: string;
  description?: string;
  updatedAt: string;
  isActive?: boolean;
}

export interface Alert {
  id: number;
  updatedAt: string;
  count: number;
  timeWindow: string;
  level: string;
  isActive?: boolean;
  createdById: number;
  applicationId: number;
  applicationName: string;
}

export interface Log {
  id: number;
  timestamp: string | number; // Can be ISO string or Unix timestamp
  level: string;
  message: string;
  applicationId: number;
  applicationName?: string;
}

export interface Permission {
  id: number;
  status: string;
  user: User;
  application: Application;
}

export interface LevelCount {
  level: string;
  count: number;
}

export interface TrendBucket {
  time: string;
  totalCount: number;
  levelCounts: LevelCount[];
}


export interface CreateAlertRequest {
  applicationId: number;
  severityLevel: string;
  count: number;
  timeWindow: string;
}

export interface Notification {
  id: number;
  userId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface LogSearchParams {
  appIds?: number[];
  levels?: string[];
  from?: string;
  to?: string;
  messageContains?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface CreateApplicationRequest {
  name: string;
  description?: string;
}

export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateAlertRequest {
  applicationId?: number;
  severityLevel?: string;
  count?: number;
  timeWindow?: string; // PT format string that backend will parse as Duration
  isActive?: boolean;
}

export interface CreateUserRequest {
  email: string;
}

export interface CreateAlertRequest {
  applicationId: number;
  severityLevel: string;
  count: number;
  timeWindow: string;
}

export interface BulkPermissionRequest {
  userIds: number[];
  appIds: number[];
}

// ApiError interface moved to HttpApiError.ts

class ApiClient {
  private async makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type if there's a body (e.g., POST/PUT)
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    debugLog(`API Request: ${options.method || 'GET'} ${url}`, options);
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for session-based auth
    });

      if (!response.ok) {
        let errorData: ApiError;
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, create a default error structure
          errorData = {
            timestamp: new Date().toISOString(),
            status: response.status,
            error: response.statusText,
            message: `HTTP ${response.status}: ${response.statusText}`
          };
        }

        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401) {
          window.location.href = buildAuthUrl('login');
          throw new HttpApiError(response.status, errorData);
        }

        // Throw structured HttpApiError for all other errors
        throw new HttpApiError(response.status, errorData, errorData.traceId);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User Management
  async getUsers(): Promise<User[]> {
    return this.makeRequest<User[]>('/users');
  }

  async createUser(user: CreateUserRequest): Promise<User> {
    return this.makeRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  // Admin-only: Get all alerts with pagination and sorting
  async getAllAlerts(page: number, size: number, sort: 'asc' | 'desc' = 'desc'): Promise<PaginatedResponse<Alert>> {
    return this.makeRequest<PaginatedResponse<Alert>>(`/alerts?page=${page}&size=${size}&sort=updatedAt,${sort}`);
  }

  async getUserApplications(userId: number): Promise<Application[]> {
    return this.makeRequest<Application[]>(`/users/${userId}/applications`);
  }

  // Application Management
  async getApplications(): Promise<Application[]> {
    return this.makeRequest<Application[]>('/applications');
  }

  async createApplication(app: CreateApplicationRequest): Promise<Application> {
    return this.makeRequest<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(app),
    });
  }

  async getApplication(id: number): Promise<Application> {
    return this.makeRequest<Application>(`/applications/${id}`);
  }

  async updateApplication(id: number, app: UpdateApplicationRequest): Promise<Application> {
    return this.makeRequest<Application>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(app),
    });
  }

  async updateAlert(id: number, alert: UpdateAlertRequest): Promise<Alert> {
    return this.makeRequest<Alert>(`/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(alert),
    });
  }

  async getApplicationUsers(applicationId: number): Promise<User[]> {
    return this.makeRequest<User[]>(`/applications/${applicationId}/users`);
  }

  // Alert Management
  async createAlert(alert: CreateAlertRequest, userId: number): Promise<Alert> {
    return this.makeRequest<Alert>('/alerts', {
      method: 'POST',
      headers: {
        'User-Id': userId.toString(),
      },
      body: JSON.stringify(alert),
    });
  }


  // Log Management
  async searchLogs(params: LogSearchParams): Promise<PaginatedResponse<Log>> {
    const queryParams = new URLSearchParams();
    
    // Handle multiple app IDs
    if (params.appIds && params.appIds.length > 0) {
      params.appIds.forEach(appId => queryParams.append('appIds', appId.toString()));
    }
    
    // Handle multiple levels
    if (params.levels && params.levels.length > 0) {
      params.levels.forEach(level => queryParams.append('levels', level));
    }
    
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    if (params.messageContains) queryParams.append('messageContains', params.messageContains);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.sort) queryParams.append('sort', params.sort);

    const url = `/logs?${queryParams}`;
    console.log('🌐 API Call: GET', url);
    console.log('🌐 Query parameters:', Object.fromEntries(queryParams as any));
    
    return this.makeRequest<PaginatedResponse<Log>>(url);
  }

  async getLogAnalysis(view: 'trends' | 'summary', period: string, appIds?: number[]): Promise<TrendBucket[] | LevelCount[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('view', view);
    queryParams.append('period', period);
    if (appIds !== undefined) {
      // Always send appIds if provided (even if empty array for user roles)
      queryParams.append('appIds', appIds.join(','));
    }

    const url = `/logs/analysis?${queryParams}`;
    return this.makeRequest<TrendBucket[] | LevelCount[]>(url);
  }

  // Helper methods for specific analysis types
  async getLogTrends(period: string, appIds?: number[]): Promise<TrendBucket[]> {
    return this.getLogAnalysis('trends', period, appIds) as Promise<TrendBucket[]>;
  }

  async getLogSummary(period: string, appIds?: number[]): Promise<LevelCount[]> {
    return this.getLogAnalysis('summary', period, appIds) as Promise<LevelCount[]>;
  }

  // Notifications API methods
  async getNotifications(page: number = 0, size: number = 20): Promise<PaginatedResponse<Notification>> {
    return this.makeRequest<PaginatedResponse<Notification>>(`/notifications?page=${page}&size=${size}`);
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    return this.makeRequest<void>(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }


  // Permission Management
  async createPermissions(request: BulkPermissionRequest): Promise<Permission[]> {
    return this.makeRequest<Permission[]>('/permissions', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async deletePermissions(request: BulkPermissionRequest): Promise<void> {
    return this.makeRequest<void>('/permissions', {
      method: 'DELETE',
      body: JSON.stringify(request),
    });
  }

  // Authentication helpers for session-based auth
  isAuthenticated(): boolean {
    // For session-based auth, we can't easily check authentication status
    // without making an API call. We'll assume authenticated if we're not on login page
    return window.location.hash !== '#login' && !window.location.hash.includes('login');
  }

  logout(): void {
    // For OIDC session-based auth, redirect to logout endpoint
    window.location.href = buildAuthUrl('logout');
  }
}

export const apiClient = new ApiClient();
