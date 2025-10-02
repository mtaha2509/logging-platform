/**
 * Toast Notification Component
 */
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return 'oj-ux-ico-check';
      case 'error': return 'oj-ux-ico-error';
      case 'warning': return 'oj-ux-ico-warning';
      case 'info': return 'oj-ux-ico-info';
      default: return 'oj-ux-ico-info';
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'success': return 'toast-success';
      case 'error': return 'toast-error';
      case 'warning': return 'toast-warning';
      case 'info': return 'toast-info';
      default: return 'toast-info';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return '#10b981'; // Green
      case 'error': return '#ef4444';   // Red
      case 'warning': return '#f59e0b'; // Orange
      case 'info': return '#3b82f6';    // Blue
      default: return '#3b82f6';
    }
  };

  return (
    <div 
      class={`toast-notification ${getColorClass()}`}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'white',
        border: `1px solid #e5e7eb`,
        borderLeft: `4px solid ${getBorderColor()}`,
        padding: '15px',
        zIndex: 999999,
        width: '300px',
        borderRadius: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        margin: '10px 0'
      }}
    >
      <div 
        class="toast-content"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <span class={`toast-icon ${getIcon()}`}></span>
        <span 
          class="toast-message"
          style={{
            flex: 1,
            color: '#374151',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {message}
        </span>
        <button 
          class="toast-close"
          onClick={onClose}
          aria-label="Close notification"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280',
            padding: '4px',
            borderRadius: '4px',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <span class="oj-ux-ico-close"></span>
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemoveToast: (id: string) => void;
}

export function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  return (
    <div 
      class="toast-container"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none' // Allow clicks to pass through container
      }}
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto', // Re-enable clicks on individual toasts
            transform: `translateY(${index * 10}px)` // Slight offset for multiple toasts
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onRemoveToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
