"use client";

import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractApiError, isAuthError } from "@/lib/api-errors";

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      silentError?: boolean;
      errorMessage?: string;
    };
    mutationMeta: {
      silentError?: boolean;
      errorMessage?: string;
      successMessage?: string;
    };
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (isAuthError(error) || query.meta?.silentError) return;
      // Skip if the query defines its own error handling.
      const opts = query.options as { onError?: unknown; throwOnError?: unknown };
      if (opts.throwOnError || opts.onError) return;
      const message = query.meta?.errorMessage ?? extractApiError(error);
      toast.error(message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (isAuthError(error) || mutation.meta?.silentError) return;
      // Skip if the mutation defines its own onError — let the component handle it.
      if (mutation.options.onError) return;
      const message = mutation.meta?.errorMessage ?? extractApiError(error);
      toast.error(message);
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      const message = mutation.meta?.successMessage;
      if (message) toast.success(message);
    },
  }),
});
