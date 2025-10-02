/**
 * App Shell Component - Modern Oracle JET application shell with improved layout
 */
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { AppHeader } from "./app-header";
import { AppDrawer } from "./app-drawer";
import { DashboardPage } from "../pages/dashboard";
import { LogsPage } from "../pages/logs";
import { ApplicationsPage } from "../pages/applications";
import { UsersPage } from "../pages/users";
import { VisualizationsPage } from "../pages/visualizations";
import { AlertsPage } from "../pages/alerts";
import { UserRole } from "../../contexts/user-context";
import { authService } from "../../services/auth";
import { errorHandler } from "../../services/errorHandler";
import { useToast } from "../../contexts/ToastContext";

interface SimpleRouter {
  go: (route: string) => void;
  getCurrentRoute: () => string;
  subscribe: (listener: (route: string) => void) => () => void;
}

interface AppShellProps {
  router: SimpleRouter;
  currentState: string;
  appName: string;
}

export function AppShell({ router, currentState, appName }: AppShellProps) {
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [userName, setUserName] = useState('Admin User');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Toast notifications
  const { showSuccess, showError, showWarning } = useToast();

  useEffect(() => {
    // Get user data from authService (backend-provided)
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const role = currentUser.role.toLowerCase() as UserRole;
      setUserRole(role);
      setUserName(currentUser.name);
    }
    
    // Subscribe to auth changes
    const unsubscribe = authService.subscribe((user) => {
      if (user) {
        const role = user.role.toLowerCase() as UserRole;
        setUserRole(role);
        setUserName(user.name);
      } else {
        setUserRole('user');
        setUserName('Guest User');
      }
    });
    
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    try {
      // Use authService logout method
      authService.logout();
      showSuccess('Logged out successfully');
      router?.go('login');
    } catch (error) {
      errorHandler.handleApiError(error, 'logging out');
    }
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };


  const renderCurrentPage = () => {
    switch (currentState) {
      case 'dashboard':
        return <DashboardPage userRole={userRole} />;
      case 'logs':
        return <LogsPage />;
      case 'applications':
        return <ApplicationsPage />;
      case 'users':
        // Only allow admin users to access the Users page
        if (userRole === 'admin') {
          return <UsersPage />;
        } else {
          return (
            <div class="oj-panel oj-panel-alt1 oj-md-padding-4x">
              <h2 class="oj-typography-heading-lg">Access Denied</h2>
              <p class="oj-typography-body-md oj-text-color-secondary">
                You do not have permission to access the Users page. This feature is only available to administrators.
              </p>
            </div>
          );
        }
      case 'alerts':
        // Only allow admin users to access the Alerts page
        if (userRole === 'admin') {
          return <AlertsPage />;
        } else {
          return (
            <div class="oj-panel oj-panel-alt1 oj-md-padding-4x">
              <h2 class="oj-typography-heading-lg">Access Denied</h2>
              <p class="oj-typography-body-md oj-text-color-secondary">
                You do not have permission to access the Alerts page. This feature is only available to administrators.
              </p>
            </div>
          );
        }
      case 'visualizations':
        return <VisualizationsPage />;
      default:
        return <DashboardPage userRole={userRole} />;
    }
  };

  return (
    <div className="app-shell">
      <AppHeader
        appName={appName}
        onToggleSidebar={handleToggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
        onLogout={handleLogout}
        isAdmin={userRole === 'admin'}
      />
      
      <div class="app-body">
        <AppDrawer 
          router={router} 
          currentRoute={currentState} 
          userRole={userRole}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        >
          <main class="app-main-content" role="main">
            {renderCurrentPage()}
          </main>
        </AppDrawer>
      </div>
    </div>
  );
}
