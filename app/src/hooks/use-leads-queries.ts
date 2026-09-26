"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { executeWithAuthRetry } from "@/lib/api/auth-fetch";
import * as leadsApi from "@/lib/leads/leads-api";
import { queryKeys } from "@/lib/query/query-keys";
import type { Lead, LeadStatus, ListLeadsParams } from "@/types/lead";

/**
 * Liste des leads (GET /leads).
 * Le token est lu depuis le cache React Query (auth.session) via executeWithAuthRetry.
 */
export function useLeads(params?: ListLeadsParams) {
  const queryClient = useQueryClient();
  const hasToken = Boolean(
    queryClient.getQueryData<string | null>(queryKeys.auth.session()),
  );

  // queryClient est stable (useQueryClient) ; le token est lu au moment du fetch
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
 * Détail d’un lead (GET /leads/:id).
 * Le token est lu depuis le cache React Query (auth.session) via executeWithAuthRetry.
 */
export function useLeadById(id: string | null) {
  const queryClient = useQueryClient();
  const hasToken = Boolean(
    queryClient.getQueryData<string | null>(queryKeys.auth.session()),
  );

  // queryClient est stable (useQueryClient) ; le token est lu au moment du fetch
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- queryClient stable
  return useQuery({
    queryKey: queryKeys.leads.detail(id ?? ""),
    queryFn: async (): Promise<Lead> => {
      if (!id) {
        throw new Error("Aucun token ou id");
      }

      return executeWithAuthRetry({
        queryClient,
        fn: leadsApi.getLeadById,
        args: [id],
        requireIdMessage: "Aucun token ou id",
      });
    },
    enabled: hasToken && Boolean(id),
  });
}

/**
 * Mutation pour mettre à jour le statut d’un lead (PATCH /leads/:id/status).
 * Invalide la liste et le détail après succès.
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
      queryClient.setQueryData(
        queryKeys.leads.detail(variables.id),
        (old: Lead | undefined) =>
          old ? { ...old, status: variables.status } : old,
      );
    },
  });
}

/**
 * Mutation pour envoyer le cold email (POST /leads/:id/send-email).
 */
export function useSendLeadEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accessToken, id }: { accessToken: string; id: string }) =>
      leadsApi.sendLeadEmail(accessToken, id),
    onSuccess: (result, variables) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
        queryClient.setQueryData(
          queryKeys.leads.detail(variables.id),
          result.data,
        );
      }
    },
  });
}

/**
 * Suppression d’un lead (DELETE /leads/:id).
 * Invalide la liste et le détail après succès.
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
