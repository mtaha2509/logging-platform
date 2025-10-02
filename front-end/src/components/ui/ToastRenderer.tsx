/**
 * Toast Renderer Component - Renders toasts at the root level
 */
import { h } from "preact";
import { useContext } from "preact/hooks";
import { ToastContainer } from "./Toast";
import { ToastContext } from "../../contexts/ToastContext";

export function ToastRenderer() {
  const context = useContext(ToastContext);
  
  if (!context) {
    return null;
  }

  return (
    <ToastContainer 
      toasts={context.toasts} 
      onRemoveToast={context.removeToast} 
    />
  );
}
