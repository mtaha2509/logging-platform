import { registerCustomElement } from "ojs/ojvcomponent";
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import Context = require("ojs/ojcontext");
import { AppShell } from "./layout/app-shell";
import { LoginPage } from "./pages/login";
import { authService } from "../services/auth";
import { ToastProvider, useToast } from "../contexts/ToastContext";
import { ToastRenderer } from "./ui/ToastRenderer";
import { errorHandler } from "../services/errorHandler";
import { buildAuthUrl } from "../config/app-config";

type Props = Readonly<{
  appName?: string;
}>;

class SimpleRouter {
  private currentRoute: string = 'login';
  private listeners: ((route: string) => void)[] = [];

  constructor() {
    // Initialize from URL hash, extract route name (before ?)
    this.currentRoute = this.extractRouteName(window.location.hash);
    
    // Listen to hash changes
    window.addEventListener('hashchange', () => {
      const newRoute = this.extractRouteName(window.location.hash);
      this.currentRoute = newRoute;
      this.notifyListeners();
    });
  }

  private extractRouteName(hash: string): string {
    // Extract route name from hash (e.g., "logs" from "#logs?appId=123")
    const route = hash.replace('#', '');
    return route.split('?')[0] || '';
  }

  go(route: string) {
    window.location.hash = route;
    this.currentRoute = this.extractRouteName(route);
    this.notifyListeners();
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  subscribe(listener: (route: string) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentRoute));
  }
}

// Error handler will be initialized inside the component

// Inner component that has access to ToastProvider context
const AppContent = ({ appName }: Props) => {
  const [currentState, setCurrentState] = useState<string>('login');
  const [router] = useState<SimpleRouter>(() => new SimpleRouter());
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get toast functions from context
  const { showSuccess, showError, showWarning } = useToast();
    
    useEffect(() => {
      // Initialize error handler with toast functions
      errorHandler.init({
        showToast: (message, type) => {
          if (type === 'success') showSuccess(message);
          else if (type === 'error') showError(message);
          else if (type === 'warning') showWarning(message);
          else showSuccess(message); // Default to success for 'info'
        },
        showModal: (title, message, traceId) => {
          alert(`${title}: ${message}${traceId ? `\nTrace ID: ${traceId}` : ''}`);
        },
        redirectToLogin: () => {
          window.location.href = buildAuthUrl('login');
        },
        redirectToAccessDenied: () => {
          window.location.hash = '#access-denied';
        },
        isDevMode: true, // Set based on environment
        isAdmin: authService.getCurrentUser()?.role === 'ADMIN'
      });

      // Initialize authentication state
      const initializeAuth = async () => {
        try {
          // Refresh auth status first to check if user is authenticated
          await authService.refreshAuthStatus();
          
          const currentUser = authService.getCurrentUser();
          const currentRoute = router.getCurrentRoute();
          
          if (currentUser) {
            // User is logged in, redirect to dashboard if on login page or root
            if (currentRoute === 'login' || currentRoute === '') {
              router.go('dashboard');
            }
          } else {
            // User not logged in, redirect to login if not already there
            if (currentRoute !== 'login') {
              router.go('login');
            }
          }
        } catch (error) {
          console.error('Failed to initialize authentication:', error);
          router.go('login');
        } finally {
          setIsInitialized(true);
        }
      };

      initializeAuth();
      setCurrentState(router.getCurrentRoute());
      
      const unsubscribe = router.subscribe((route) => {
        setCurrentState(route);
      });
      
      Context.getPageContext().getBusyContext().applicationBootstrapComplete();
      
      return unsubscribe;
    }, [router]);

    const renderCurrentPage = () => {
      if (!isInitialized) {
        return (
          <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center" style="height: 100vh;">
            <div class="oj-panel oj-panel-alt1" style="padding: 2rem; text-align: center;">
              <h3>Loading...</h3>
              <p>Initializing application...</p>
            </div>
          </div>
        );
      }

      switch (currentState) {
        case 'login':
          return <LoginPage />;
        default:
          return <AppShell router={router} currentState={currentState} appName={appName || "Centralized Logging Platform"} />;
      }
    };
    
    return (
      <div id="appContainer" class="oj-web-applayout-page">
        {renderCurrentPage()}
        <ToastRenderer />
      </div>
    );
  };

// Main App component that wraps everything with ToastProvider
export const App = registerCustomElement(
  "app-root",
  ({ appName = "Centralized Logging Platform" }: Props) => {
    return (
      <ToastProvider>
        <AppContent appName={appName || "Centralized Logging Platform"} />
      </ToastProvider>
    );
  }
);
