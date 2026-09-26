import type { QueryClient } from '@tanstack/react-query';

import * as authApi from '@/lib/auth/auth-api';
import { queryKeys } from '@/lib/query/query-keys';

type AuthenticatedGetFn<TArgs extends unknown[], TData> = (
  accessToken: string,
  ...args: TArgs
) => Promise<{ ok: true; data: TData } | { ok: false; error: string }>;

interface WithAuthRetryOptions<TArgs extends unknown[], TData> {
  queryClient: QueryClient;
  fn: AuthenticatedGetFn<TArgs, TData>;
  args: TArgs;
  requireIdMessage?: string;
}

/**
 * Run an authenticated GET with the current token.
 * If the API returns "Non authentifié.", try a refresh then replay the request once.
 */
export async function executeWithAuthRetry<TArgs extends unknown[], TData>({
  queryClient,
  fn,
  args,
  requireIdMessage,
}: WithAuthRetryOptions<TArgs, TData>): Promise<TData> {
  const tokenFromCache = queryClient.getQueryData<string | null>(queryKeys.auth.session());

  if (!tokenFromCache) {
    throw new Error(requireIdMessage ?? 'Aucun token');
  }

  let result = await fn(tokenFromCache, ...args);

  if (!result.ok && result.error === 'Non authentifié.') {
    const refreshResult = await authApi.refresh();

    if (!refreshResult.ok) {
      queryClient.setQueryData(queryKeys.auth.session(), null);
      throw new Error('Session expirée, veuillez vous reconnecter.');
    }

    queryClient.setQueryData(queryKeys.auth.session(), refreshResult.accessToken);

    result = await fn(refreshResult.accessToken, ...args);
  }

  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.data;
}
