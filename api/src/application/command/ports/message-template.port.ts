import type { LeadType } from '@/domain/lead/lead.type.ts';

/**
 * Port for rendering outreach messages (cold email, LinkedIn).
 */
export interface MessageTemplatePort {
  renderColdEmail(lead: LeadType): { subject: string; html: string };
  renderLinkedInMessage(lead: LeadType): string;
}
