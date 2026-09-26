'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { executeWithAuthRetry } from '@/lib/api/auth-fetch';
import * as leadsApi from '@/lib/leads/leads-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { Lead, LeadStatus, ListLeadsParams } from '@/types/lead';

/**
 * List leads (GET /leads).
 * Token is read from the React Query cache (auth.session) via executeWithAuthRetry.
 */
export function useLeads(params?: ListLeadsParams) {
  const queryClient = useQueryClient();
  const hasToken = Boolean(queryClient.getQueryData<string | null>(queryKeys.auth.session()));

  // queryClient is stable (useQueryClient); token is read at fetch time
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- queryClient stable
  return useQuery({
    queryKey: queryKeys.leads.list(params),
    queryFn: async (): Promise<Lead[]> =>
      executeWithAuthRetry({
        queryClient,
        fn: leadsApi.getLeads,
        args: [params],
      }),
    enabled: hasToken,
  });
}

/**
 * Lead detail (GET /leads/:id).
 * Token is read from React Query cache (auth.session) via executeWithAuthRetry.
 */
export function useLeadById(id: string | null) {
  const queryClient = useQueryClient();
  const hasToken = Boolean(queryClient.getQueryData<string | null>(queryKeys.auth.session()));

  // queryClient is stable (useQueryClient); token is read at fetch time
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- queryClient stable
  return useQuery({
    queryKey: queryKeys.leads.detail(id ?? ''),
    queryFn: async (): Promise<Lead> => {
      if (!id) {
        throw new Error('Aucun token ou id');
      }

      return executeWithAuthRetry({
        queryClient,
        fn: leadsApi.getLeadById,
        args: [id],
        requireIdMessage: 'Aucun token ou id',
      });
    },
    enabled: hasToken && Boolean(id),
  });
}

/**
 * Mutation to update a lead's status (PATCH /leads/:id/status).
 * Invalidates list and detail after success.
 */
export function useUpdateLeadStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accessToken,
      id,
      status,
    }: {
      accessToken: string;
      id: string;
      status: LeadStatus;
    }) => leadsApi.updateLeadStatus(accessToken, id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.setQueryData(queryKeys.leads.detail(variables.id), (old: Lead | undefined) =>
        old ? { ...old, status: variables.status } : old,
      );
    },
  });
}

/**
 * Mutation to send a cold email (POST /leads/:id/send-email).
 */
export function useSendLeadEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accessToken, id }: { accessToken: string; id: string }) =>
      leadsApi.sendLeadEmail(accessToken, id),
    onSuccess: (result, variables) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
        queryClient.setQueryData(queryKeys.leads.detail(variables.id), result.data);
      }
    },
  });
}

/**
 * Delete a lead (DELETE /leads/:id).
 * Invalidates list and detail after success.
 */
export function useDeleteLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accessToken, id }: { accessToken: string; id: string }) =>
      leadsApi.deleteLead(accessToken, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.removeQueries({
        queryKey: queryKeys.leads.detail(variables.id),
      });
    },
  });
}
