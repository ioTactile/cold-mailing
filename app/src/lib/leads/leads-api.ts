import type { Lead, LeadStatus, ListLeadsParams } from "@/types/lead";

import { defaultFetchOptions, getApiUrl } from "../api/api-client";

function leadsBase() {
  return `${getApiUrl()}/leads`;
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    ...defaultFetchOptions.headers,
    Authorization: `Bearer ${accessToken}`,
  } as HeadersInit;
}

/**
 * Liste des leads : GET /leads.
 */
export async function getLeads(
  accessToken: string,
  params?: ListLeadsParams,
): Promise<{ ok: true; data: Lead[] } | { ok: false; error: string }> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.source) search.set("source", params.source);
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.offset != null) search.set("offset", String(params.offset));
  const qs = search.toString();
  const url = qs ? `${leadsBase()}?${qs}` : leadsBase();

  const res = await fetch(url, {
    ...defaultFetchOptions,
    method: "GET",
    headers: authHeaders(accessToken),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      ok: false,
      error: (data?.error as string) ?? "Erreur lors du chargement des leads.",
    };
  }

  return { ok: true, data: data as Lead[] };
}

/**
 * Détail d’un lead : GET /leads/:id.
 */
export async function getLeadById(
  accessToken: string,
  id: string,
): Promise<{ ok: true; data: Lead } | { ok: false; error: string }> {
  const res = await fetch(`${leadsBase()}/${id}`, {
    ...defaultFetchOptions,
    method: "GET",
    headers: authHeaders(accessToken),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 404) {
      return { ok: false, error: "Lead non trouvé." };
    }
    return {
      ok: false,
      error: (data?.error as string) ?? "Erreur lors du chargement du lead.",
    };
  }

  return { ok: true, data: data as Lead };
}

/**
 * Mise à jour du statut : PATCH /leads/:id/status.
 */
export async function updateLeadStatus(
  accessToken: string,
  id: string,
  status: LeadStatus,
): Promise<{ ok: true; data: Lead } | { ok: false; error: string }> {
  const res = await fetch(`${leadsBase()}/${id}/status`, {
    ...defaultFetchOptions,
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ status }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 404) {
      return { ok: false, error: "Lead non trouvé." };
    }
    return {
      ok: false,
      error: (data?.error as string) ?? "Erreur lors de la mise à jour.",
    };
  }

  return { ok: true, data: data as Lead };
}

export interface LinkedInMessageResponse {
  message: string;
  companyLinkedInUrl?: string;
}

/**
 * Message LinkedIn personnalisé : GET /leads/:id/linkedin-message.
 */
export async function getLinkedInMessage(
  accessToken: string,
  id: string,
): Promise<
  | { ok: true; data: LinkedInMessageResponse }
  | { ok: false; error: string }
> {
  const res = await fetch(`${leadsBase()}/${id}/linkedin-message`, {
    ...defaultFetchOptions,
    method: "GET",
    headers: authHeaders(accessToken),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 404) {
      return { ok: false, error: "Lead non trouvé." };
    }
    return {
      ok: false,
      error: (data?.error as string) ?? "Erreur lors du chargement.",
    };
  }

  return { ok: true, data: data as LinkedInMessageResponse };
}

/**
 * Envoi du cold email : POST /leads/:id/send-email.
 */
export async function sendLeadEmail(
  accessToken: string,
  id: string,
): Promise<{ ok: true; data: Lead } | { ok: false; error: string }> {
  const res = await fetch(`${leadsBase()}/${id}/send-email`, {
    ...defaultFetchOptions,
    method: "POST",
    headers: authHeaders(accessToken),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 404) {
      return { ok: false, error: "Lead non trouvé." };
    }
    if (res.status === 429) {
      return {
        ok: false,
        error: (data?.error as string) ?? "Limite quotidienne atteinte.",
      };
    }
    return {
      ok: false,
      error: (data?.error as string) ?? "Erreur lors de l'envoi.",
    };
  }

  return { ok: true, data: data as Lead };
}

export type DiscoverEvent =
  | { type: "step"; message: string }
  | { type: "lead_created"; lead: Lead }
  | { type: "skip"; reason: string; company?: string }
  | { type: "done"; created: number; skipped: number }
  | { type: "error"; message: string };

export interface DiscoverOptions {
  source: "WTTJ";
  query?: string;
  limit?: number;
}

/**
 * Lance la découverte de leads (POST /leads/discover) et lit le flux SSE.
 * Appelle onEvent pour chaque événement reçu.
 */
export async function discoverLeads(
  accessToken: string,
  options: DiscoverOptions,
  onEvent: (event: DiscoverEvent) => void,
): Promise<void> {
  const res = await fetch(`${getApiUrl()}/leads/discover`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(options),
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    onEvent({
      type: "error",
      message: (data?.error as string) ?? "Erreur lors du lancement de la découverte.",
    });
    onEvent({ type: "done", created: 0, skipped: 0 });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event = JSON.parse(line.slice(6)) as DiscoverEvent;
          onEvent(event);
        } catch {
          // ignore invalid JSON
        }
      }
    }
  }
  if (buffer.startsWith("data: ")) {
    try {
      const event = JSON.parse(buffer.slice(6)) as DiscoverEvent;
      onEvent(event);
    } catch {
      // ignore
    }
  }
}
