"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as leadsApi from "@/lib/leads/leads-api";
import { queryKeys } from "@/lib/query/query-keys";
import type { Lead, LeadStatus, ListLeadsParams } from "@/types/lead";

/**
 * Liste des leads (GET /leads). Requiert un accessToken.
 */
export function useLeads(accessToken: string | null, params?: ListLeadsParams) {
  return useQuery({
    queryKey: queryKeys.leads.list(params),
    queryFn: async (): Promise<Lead[]> => {
      if (!accessToken) throw new Error("No token");
      const result = await leadsApi.getLeads(accessToken, params);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: Boolean(accessToken),
  });
}

/**
 * Détail d’un lead (GET /leads/:id).
 */
export function useLeadById(accessToken: string | null, id: string | null) {
  return useQuery({
    queryKey: queryKeys.leads.detail(id ?? ""),
    queryFn: async (): Promise<Lead> => {
      if (!accessToken || !id) throw new Error("No token or id");
      const result = await leadsApi.getLeadById(accessToken, id);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: Boolean(accessToken) && Boolean(id),
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
