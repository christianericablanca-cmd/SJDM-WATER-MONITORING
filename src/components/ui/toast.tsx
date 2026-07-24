"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-2 sm:p-4 sm:max-w-[420px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

type ToastVariant = "default" | "success" | "error" | "warning" | "info";

const variantStyles: Record<ToastVariant, { icon: React.ReactNode; className: string }> = {
  default: { icon: null, className: "border-border" },
  success: {
    icon: <CheckCircle2 className="h-4 w-4 text-success shrink-0" />,
    className: "border-green-200 dark:border-green-800 bg-white dark:bg-gray-900",
  },
  error: {
    icon: <AlertCircle className="h-4 w-4 text-destructive shrink-0" />,
    className: "border-red-200 dark:border-red-800 bg-white dark:bg-gray-900",
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 text-warning shrink-0" />,
    className: "border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-900",
  },
  info: {
    icon: <Info className="h-4 w-4 text-water shrink-0" />,
    className: "border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900",
  },
};

interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> {
  variant?: ToastVariant;
  description?: string;
}

const Toast = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ className, variant = "default", description, children, ...props }, ref) => {
  const v = variantStyles[variant];
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center gap-2 sm:gap-3 overflow-hidden rounded-xl border p-3 sm:p-4 shadow-dropdown transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full",
        v.className,
        className,
      )}
      {...props}
    >
      {v.icon}
      <div className="flex-1 min-w-0">
        <ToastPrimitives.Title className="text-sm font-semibold">
          {children}
        </ToastPrimitives.Title>
        {description && (
          <ToastPrimitives.Description className="text-xs text-muted-foreground mt-0.5">
            {description}
          </ToastPrimitives.Description>
        )}
      </div>
      <ToastPrimitives.Close className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors">
        <X className="h-4 w-4" />
      </ToastPrimitives.Close>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = "Toast";

type ToastActionElement = React.ReactElement;

export { ToastProvider, ToastViewport, Toast };
export type { ToastProps, ToastVariant, ToastActionElement };
