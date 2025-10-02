/**
 * App Header Component - Modern Oracle JET header with improved UX
 */
import { h } from "preact";
import { NotificationBell } from "../ui/NotificationBell";

// Modern Oracle JET Core Pack components
import "oj-c/button";

interface AppHeaderProps {
  appName: string;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  onLogout: () => void;
  isAdmin: boolean;
}

export function AppHeader({ 
  appName, 
  onToggleSidebar, 
  sidebarCollapsed,
  onLogout,
  isAdmin
}: AppHeaderProps) {
  

  return (
    <header 
      role="banner" 
      class="oj-web-applayout-header"
    >
      <div 
        class="oj-web-applayout header-toolbar oj-flex-bar oj-sm-align-items-center"
        role="toolbar"
        aria-label="Application header"
        
      >
        {/* Left: Menu toggle */}
        <div class="oj-flex-bar-start oj-flex oj-sm-align-items-center">
          <oj-c-button 
            label="Toggle sidebar"
            display="icons"
            chroming="borderless"
            onojAction={onToggleSidebar}
            class="header-toggle-btn"
          >
            <span 
              slot="startIcon" 
              class="oj-ux-ico-menu"
            ></span>
          </oj-c-button>
        </div>

        {/* Center: App title */}
        <div class="oj-flex-bar-middle oj-flex oj-sm-align-items-center oj-sm-justify-content-center">
          <h1 class="oj-typography-heading-md header-title">
            {appName}
          </h1>
        </div>

        {/* Right: Notifications and logout */}
        <div class="oj-flex-bar-end oj-flex oj-sm-align-items-center">
          {/* Notification Bell */}
          {!isAdmin && (
          <NotificationBell className="header-notification-bell" />
          )}
          
          {/* Simple logout button */}
          <oj-c-button 
            label="Sign Out"
            display="icons" // Change to "all" if you want text + icon for better accessibility
            chroming="borderless"
            onojAction={onLogout}
            class="header-logout-btn"
          >
            <span 
              slot="startIcon" 
              class="oj-ux-ico-log-out"
            ></span>
          </oj-c-button>
        </div>
      </div>
    </header>
  );
}