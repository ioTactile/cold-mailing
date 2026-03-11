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
} as const;

export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

const LEAD_SOURCES: LeadSource[] = Object.values(LeadSource);

export function isLeadSource(value: string): value is LeadSource {
	return (LEAD_SOURCES as string[]).includes(value);
}

export function toLeadSource(value: string): LeadSource {
	if (isLeadSource(value)) {
		return value;
	}
	throw new Error(`Source de prospects invalide: ${value}`);
}

export interface LeadType {
	id: string;
	company: string;
	domain: string;
	email: string | null;
	linkedin: string | null;
	techStack: string | null;
	source: LeadSource;
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
	source: LeadSource;
	status?: LeadStatus;
}
