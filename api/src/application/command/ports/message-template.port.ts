import type { LeadType } from "@/domain/lead/lead.type.ts";

/**
 * Port pour le rendu des messages de prospection (email froid, LinkedIn).
 */
export interface MessageTemplatePort {
	renderColdEmail(lead: LeadType): { subject: string; html: string };
	renderLinkedInMessage(lead: LeadType): string;
}
