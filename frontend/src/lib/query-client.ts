import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        // Keep data fresh in client cache for 30 minutes so repeated navigations/renderings never re-fetch
        staleTime: 30 * 60 * 1000,
        // Keep cached query responses in memory for 2 hours
        gcTime: 120 * 60 * 1000,
        // Do not make background calls on component mount if data is already loaded in cache
        refetchOnMount: false,
        // Do not refetch when switching browser tabs or focusing window
        refetchOnWindowFocus: false,
        // Do not refetch on network reconnect
        refetchOnReconnect: false,
      },
    },
  });
}
