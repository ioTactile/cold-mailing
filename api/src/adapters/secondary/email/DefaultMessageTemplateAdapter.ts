import type { MessageTemplatePort } from "@/application/command/ports/message-template.port.ts";
import type { LeadType } from "@/domain/lead/lead.type.ts";
import { renderLinkedInMessage } from "@/pkg/email/linkedin-template.ts";
import { renderColdEmailTemplate } from "@/pkg/email/templates.ts";

export class DefaultMessageTemplateAdapter implements MessageTemplatePort {
	renderColdEmail(lead: LeadType): { subject: string; html: string } {
		return renderColdEmailTemplate(lead);
	}

	renderLinkedInMessage(lead: LeadType): string {
		return renderLinkedInMessage(lead);
	}
}
