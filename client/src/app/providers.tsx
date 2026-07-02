import type { ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { store } from './store';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/common/Toaster';

/** Composes all global context providers around the app tree. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ReduxProvider>
  );
}
