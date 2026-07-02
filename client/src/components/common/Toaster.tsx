import { useSyncExternalStore } from 'react';
import { toastStore, type ToastType } from '@/lib/toast';
import { cn } from '@/lib/cn';

const STYLES: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-slate-200 bg-white text-slate-700',
};

/** Renders the global toast stack (top-right). Driven by the module toast store. */
export function Toaster() {
  const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.type === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-sm',
            STYLES[t.type],
          )}
        >
          <span className="break-words">{t.message}</span>
          <button
            onClick={() => toastStore.dismiss(t.id)}
            className="shrink-0 opacity-60 transition hover:opacity-100"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
