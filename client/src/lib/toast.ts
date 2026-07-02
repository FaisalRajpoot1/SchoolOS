export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();
const emit = (): void => listeners.forEach((l) => l(toasts));

const AUTO_DISMISS_MS = 5000;

/** Minimal module-level toast store (usable from React and non-React code). */
export const toastStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): ToastItem[] {
    return toasts;
  },
  push(type: ToastType, message: string): void {
    const id = nextId++;
    toasts = [...toasts, { id, type, message }];
    emit();
    setTimeout(() => toastStore.dismiss(id), AUTO_DISMISS_MS);
  },
  dismiss(id: number): void {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  },
};

/** Fire-and-forget toast helpers. */
export const toast = {
  success: (message: string): void => toastStore.push('success', message),
  error: (message: string): void => toastStore.push('error', message),
  info: (message: string): void => toastStore.push('info', message),
};
