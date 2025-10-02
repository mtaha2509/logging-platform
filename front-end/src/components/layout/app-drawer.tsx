/**
 * App Drawer Component - Modern Oracle JET navigation drawer with improved UX
 */
import { h, ComponentChildren } from "preact";
import { useState, useEffect } from "preact/hooks";
import { UserRole } from "../../contexts/user-context";

// Modern Oracle JET Core Pack components
import "oj-c/drawer-layout";
import "oj-c/list-item-layout";
import "oj-c/avatar";

// Traditional navigation list for specific functionality
import "ojs/ojnavigationlist";

interface SimpleRouter {
  go: (route: string) => void;
  getCurrentRoute: () => string;
  subscribe: (listener: (route: string) => void) => () => void;
}

interface AppDrawerProps {
  router: SimpleRouter;
  currentRoute: string;
  userRole: UserRole;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  children: ComponentChildren;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
}

export function AppDrawer({ router, currentRoute, userRole, sidebarCollapsed, onToggleSidebar, children }: AppDrawerProps) {

  const navigationItems: NavigationItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "oj-ux-ico-bar-chart",
      route: "dashboard"
    },
    {
      id: "logs",
      label: "Logs",
      icon: "oj-ux-ico-file-text",
      route: "logs"
    },
    {
      id: "applications",
      label: "Applications",
      icon: "oj-ux-ico-application",
      route: "applications"
    },
    {
      id: "users",
      label: "Users",
      icon: "oj-ux-ico-user",
      route: "users",
      roles: ["admin"]
    },
    {
      id: "alerts",
      label: "Alerts",
      icon: "oj-ux-ico-warning",
      route: "alerts",
      roles: ["admin"]
    },
    {
      id: "visualizations",
      label: "Visualizations",
      icon: "oj-ux-ico-chart",
      route: "visualizations"
    }
  ];

  const handleNavigation = (event: any) => {
    const selectedKey = event.detail.value;
    if (selectedKey && selectedKey !== currentRoute) {
      router.go(selectedKey);
    }
    // Auto-close drawer on mobile after navigation
    if (isMobile && !sidebarCollapsed) {
      setTimeout(() => onToggleSidebar(), 100);
    }
  };
  
  // Determine display mode based on screen size
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    
    checkMobile();
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    mediaQuery.addEventListener('change', checkMobile);
    
    return () => mediaQuery.removeEventListener('change', checkMobile);
  }, []);

  const filteredNavigationItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  );
  
  const getUserRoleInfo = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrator', color: 'danger' };
      case 'user':
        return { label: 'User', color: 'info' };
      default:
        return { label: 'User', color: 'neutral' };
    }
  };

  const roleInfo = getUserRoleInfo(userRole);

  return (
    <oj-c-drawer-layout 
      startOpened={!sidebarCollapsed}
      startDisplay={isMobile ? 'overlay' : 'reflow'}
      class="app-drawer-layout"
    >
      {/* Drawer Navigation Content */}
      <div slot="start" class="drawer-content">
        
        {/* Navigation Section */}
        <nav class="drawer-nav" aria-label="Main navigation">
          <oj-navigation-list 
            selection={currentRoute}
            onselectionChanged={handleNavigation}
            class="nav-list"
            drill-mode="none"
          >
            <ul class="nav-items">
              {filteredNavigationItems.map(item => (
                <li key={item.id} id={item.id}>
                  <a 
                    href={`#${item.route}`} 
                    class={`nav-link ${currentRoute === item.route ? 'oj-selected' : ''}`}
                    aria-current={currentRoute === item.route ? 'page' : undefined}
                  >
                    <oj-c-list-item-layout class="nav-item-layout">
                      <span slot="leading" class={`nav-icon ${item.icon}`}></span>
                      <span class="nav-label">{item.label}</span>
                    </oj-c-list-item-layout>
                  </a>
                </li>
              ))}
            </ul>
          </oj-navigation-list>
        </nav>

        {/* User Info Footer */}
        <div class="drawer-user-info">
          <div class="user-card">
            <oj-c-avatar 
              class="user-avatar"
              initials={userRole.charAt(0).toUpperCase()}
            />
            <div class="user-details">
              <div class="user-role">
                <span class={`role-badge role-${userRole}`}>
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Application Content */}
      <div class="drawer-main">
        {children}
      </div>
    </oj-c-drawer-layout>
  );
}
