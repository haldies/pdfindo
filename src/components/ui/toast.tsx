import * as React from "react";

export interface ToastProps {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: 'default' | 'destructive';
}

export type ToastActionElement = React.ReactElement;

// Placeholder toast component for Next.js
export function Toast({ title, description, variant = 'default' }: ToastProps) {
  return (
    <div className={`rounded-lg border p-4 shadow-lg ${
      variant === 'destructive' 
        ? 'bg-destructive border-destructive text-destructive-foreground' 
        : 'bg-card border-border'
    }`}>
      {title && <div className="font-semibold">{title}</div>}
      {description && <div className="text-sm opacity-90">{description}</div>}
    </div>
  );
}
