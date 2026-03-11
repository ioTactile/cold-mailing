/** Statut d’un lead (aligné sur l’API). */
export const LeadStatus = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  REPLIED: "REPLIED",
  INTERESTED: "INTERESTED",
  CLOSED: "CLOSED",
} as const;

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const LeadSource = {
  WTTJ: "WTTJ",
  INDEED: "INDEED",
} as const;

export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export interface Lead {
  id: string;
  company: string;
  domain: string;
  email: string | null;
  linkedin: string | null;
  techStack: string | null;
  source: LeadSource;
  status: LeadStatus;
  createdAt: string;
  contactedAt?: string | null;
}

export interface ListLeadsParams {
  status?: LeadStatus;
  source?: LeadSource;
  limit?: number;
  offset?: number;
}
