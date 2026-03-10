export const LeadStatus = {
	NEW: "NEW",
	CONTACTED: "CONTACTED",
	REPLIED: "REPLIED",
	INTERESTED: "INTERESTED",
	CLOSED: "CLOSED",
} as const;

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export interface LeadType {
	id: string;
	company: string;
	domain: string;
	email: string | null;
	linkedin: string | null;
	techStack: string | null;
	source: string;
	status: LeadStatus;
	createdAt: Date;
	contactedAt: Date | null;
}

export interface CreateLeadInputType {
	company: string;
	domain: string;
	email?: string | null;
	linkedin?: string | null;
	techStack?: string | null;
	source: string;
	status?: LeadStatus;
}
