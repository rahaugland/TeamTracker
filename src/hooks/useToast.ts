import { create } from 'zustand';
import type { Toast, ToastVariant } from '@/components/ui/toast';

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  clearAll: () => {
    set({ toasts: [] });
  },
}));

interface ToastOptions {
  title?: string;
  duration?: number;
}

export function useToast() {
  const { addToast, removeToast, clearAll } = useToastStore();

  const toast = {
    success: (description: string, options?: ToastOptions) => {
      addToast({
        variant: 'success',
        description,
        title: options?.title,
        duration: options?.duration,
      });
    },
    error: (description: string, options?: ToastOptions) => {
      addToast({
        variant: 'error',
        description,
        title: options?.title,
        duration: options?.duration,
      });
    },
    warning: (description: string, options?: ToastOptions) => {
      addToast({
        variant: 'warning',
        description,
        title: options?.title,
        duration: options?.duration,
      });
    },
    info: (description: string, options?: ToastOptions) => {
      addToast({
        variant: 'info',
        description,
        title: options?.title,
        duration: options?.duration,
      });
    },
    custom: (variant: ToastVariant, description: string, options?: ToastOptions) => {
      addToast({
        variant,
        description,
        title: options?.title,
        duration: options?.duration,
      });
    },
  };

  return {
    toast,
    removeToast,
    clearAll,
  };
}
