"use client";

import * as React from "react";
import { Toast, ToastProvider, ToastViewport } from "@/components/ui/toast";
import type { ToastVariant } from "@/components/ui/toast";

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextType {
  toast: (title: string, description?: string, variant?: ToastVariant) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastNotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback((title: string, description?: string, variant: ToastVariant = "default") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const ctx = React.useMemo<ToastContextType>(() => ({
    toast: addToast,
    success: (title: string, desc?: string) => addToast(title, desc, "success"),
    error: (title: string, desc?: string) => addToast(title, desc, "error"),
    warning: (title: string, desc?: string) => addToast(title, desc, "warning"),
    info: (title: string, desc?: string) => addToast(title, desc, "info"),
  }), [addToast]);

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <ToastProvider>
        {toasts.map((t) => (
          <Toast key={t.id} variant={t.variant} description={t.description}>
            {t.title}
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}
