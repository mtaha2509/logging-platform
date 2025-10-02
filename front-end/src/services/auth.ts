import { apiClient } from './api';
import { config, buildAuthUrl, debugLog } from '../config/app-config';

/**
 * Authentication service for session-based OIDC authentication
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  picture?: string;
  assignedApplicationIds?: number[]; // Backend-provided application permissions
}

class AuthService {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Check for existing session on initialization
    this.checkAuthStatus();
  }

  async login(): Promise<void> {
    try {
      // Redirect to backend OAuth2 endpoint - backend handles the entire flow
      window.location.href = buildAuthUrl('login');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint
      const response = await fetch(buildAuthUrl('logout'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.currentUser = null;
      this.notifyListeners();
      
      // Redirect to login page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear local state even if backend call fails
      this.currentUser = null;
      this.notifyListeners();
      window.location.href = '/';
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private async checkAuthStatus(): Promise<void> {
    try {
      // Use the backend's /api/auth/user endpoint as single source of truth
      const response = await fetch(buildAuthUrl('user'), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('User data received from backend:', userData);
        
        this.currentUser = {
          id: userData.id || userData.sub || userData.email,
          email: userData.email,
          name: userData.name || userData.given_name + ' ' + userData.family_name || userData.login,
          role: userData.role || this.determineRole(userData.email), // Use backend role if available
          picture: userData.picture || userData.avatar_url,
          assignedApplicationIds: userData.assignedApplicationIds || [], // Backend-provided permissions
        };
      } else if (response.status === 401) {
        // User not authenticated
        this.currentUser = null;
      } else {
        console.error('Auth check failed with status:', response.status);
        this.currentUser = null;
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      this.currentUser = null;
    }
    
    this.notifyListeners();
  }

  private determineRole(email: string): 'ADMIN' | 'USER' {
    // Role determination based on email domain
    if (email.endsWith('@gosaas.io')) {
      return 'ADMIN';
    }
    return 'USER';
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  // Method to refresh auth status (useful after OAuth2 redirect)
  async refreshAuthStatus(): Promise<void> {
    await this.checkAuthStatus();
  }
  getUserRole(): 'USER' | 'ADMIN' {
    const user = this.getCurrentUser();
    return user?.role || 'USER';
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    const user = this.getCurrentUser();
    return user?.id || null;
  }

  /**
   * Check if user has admin privileges
   */
  isAdmin(): boolean {
    return this.getUserRole() === 'ADMIN';
  }

  /**
   * Get user's assigned application IDs from backend
   */
  getAssignedApplicationIds(): number[] {
    return this.currentUser?.assignedApplicationIds || [];
  }

  /**
   * Check if user can access specific application
   */
  canAccessApplication(applicationId: number): boolean {
    if (!this.currentUser) return false;
    
    // Admins can access all applications
    if (this.currentUser.role === 'ADMIN') return true;
    
    // Regular users can only access assigned applications
    return this.currentUser.assignedApplicationIds?.includes(applicationId) || false;
  }

  /**
   * Simulate user role change (for development/testing)
   */
  simulateUserRole(role: 'USER' | 'ADMIN', name?: string): void {
    if (this.currentUser) {
      this.currentUser.role = role;
      if (name) {
        this.currentUser.name = name;
      }
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      localStorage.setItem('simulatedUserRole', role);
      if (name) {
        localStorage.setItem('simulatedUserName', name);
      }
    }
  }
}

export const authService = new AuthService();
