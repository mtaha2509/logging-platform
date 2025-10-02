/**
 * Toast Context - Global toast notification system
 */
import { h, createContext } from "preact";
import { useContext, useState, useCallback } from "preact/hooks";
import { ToastContainer, ToastMessage } from "../components/ui/Toast";

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  // Expose toast state for rendering
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

interface ToastProviderProps {
  children: any;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info', 
    duration = 5000
  ) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: ToastMessage = {
      id,
      message,
      type,
      duration
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    toasts,
    removeToast
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
