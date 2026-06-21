import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryOptions } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { getErrorMessage, logoutRequest } from './api';
import { getCurrentUser } from './server';

/** Shared query for the current user. Source of truth for auth state. */
export const meQueryOptions = queryOptions({
  queryKey: ['auth', 'me'] as const,
  queryFn: () => getCurrentUser(),
  staleTime: 5 * 60 * 1000,
});

/** Reads the current user from the auth cache. Returns null when signed out. */
export function useCurrentUser() {
  return useQuery(meQueryOptions).data ?? null;
}

/** Logout mutation: clears the session and returns home. */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutRequest,
    onSuccess: async () => {
      queryClient.setQueryData(meQueryOptions.queryKey, null);
      // Leave the protected route before invalidating, otherwise the dashboard
      // guard re-runs first and bounces to /login (a brief login-screen flash).
      await router.navigate({ to: '/' });
      await router.invalidate();
      toast.success('Signed out');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
