export const LeadStatus = {
  NEW: "new",
  CONTACTED: "contacted",
  REPLIED: "replied",
  INTERESTED: "interested",
  CLOSED: "closed",
} as const;

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export interface Lead {
  id: string;
  company: string;
  domain: string;
  email: string;
  linkedin: string;
  techStack: string;
  source: string;
  status: LeadStatus;
  createdAt: Date;
}
