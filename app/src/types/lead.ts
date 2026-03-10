/** Statut d’un lead (aligné sur l’API). */
export const LeadStatus = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  REPLIED: "REPLIED",
  INTERESTED: "INTERESTED",
  CLOSED: "CLOSED",
} as const;

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export interface Lead {
  id: string;
  company: string;
  domain: string;
  email: string | null;
  linkedin: string | null;
  techStack: string | null;
  source: string;
  status: LeadStatus;
  createdAt: string;
  contactedAt?: string | null;
}

export interface ListLeadsParams {
  status?: LeadStatus;
  source?: string;
  limit?: number;
  offset?: number;
}
