import type { LeadStatus } from "@/types/lead";

/**
 * Clés de requête TanStack Query pour invalidation et cache.
 * Une clé par "ressource" ou route API.
 */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    /** Session = accessToken (via POST /auth/refresh avec cookie). */
    session: () => [...queryKeys.auth.all, "session"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },
  leads: {
    all: ["leads"] as const,
    list: (filters?: { status?: LeadStatus; source?: string }) =>
      [...queryKeys.leads.all, "list", filters ?? {}] as const,
    detail: (id: string) => [...queryKeys.leads.all, "detail", id] as const,
  },
} as const;
