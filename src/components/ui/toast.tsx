import * as React from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title?: string;
  description: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const variantStyles = {
  success: 'bg-emerald-500/10 border-emerald-500 text-emerald-400',
  error: 'bg-club-primary/10 border-club-primary text-club-primary',
  warning: 'bg-club-secondary/10 border-club-secondary text-club-secondary',
  info: 'bg-vq-teal/10 border-vq-teal text-vq-teal',
};

const variantIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const variantIconColors = {
  success: 'text-emerald-400',
  error: 'text-club-primary',
  warning: 'text-club-secondary',
  info: 'text-vq-teal',
};

function ToastItem({ toast, onClose }: ToastItemProps) {
  const Icon = variantIcons[toast.variant];

  React.useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm rounded-lg border-l-4 bg-card p-4 shadow-lg transition-all',
        'animate-in slide-in-from-right-full',
        variantStyles[toast.variant]
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0', variantIconColors[toast.variant])} />
        <div className="flex-1 space-y-1">
          {toast.title && (
            <div className="font-semibold text-sm leading-none">{toast.title}</div>
          )}
          <div className="text-sm opacity-90">{toast.description}</div>
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="flex-shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:flex-col md:max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
