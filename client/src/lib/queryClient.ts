import { QueryClient } from '@tanstack/react-query';

/**
 * Global React Query client with conservative defaults. Mutation errors are
 * surfaced inline by each page; toasts are used for positive/explicit feedback
 * (see `@/lib/toast`) to avoid double-reporting the same error.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
