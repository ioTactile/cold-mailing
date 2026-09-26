import { Result } from "typescript-result";
import type { MessageTemplatePort } from "@/application/command/ports/message-template.port.ts";
import type { LeadRepository } from "@/domain/lead/lead.repository.ts";

export interface LinkedInMessageResult {
	message: string;
	companyLinkedInUrl?: string;
}

export class GetLinkedInMessageForLeadUsecase {
	private readonly leadRepository: LeadRepository;
	private readonly messageTemplate: MessageTemplatePort;

	constructor(
		leadRepository: LeadRepository,
		messageTemplate: MessageTemplatePort,
	) {
		this.leadRepository = leadRepository;
		this.messageTemplate = messageTemplate;
	}

	async execute(leadId: string): Promise<Result<LinkedInMessageResult, Error>> {
		const leadResult = await this.leadRepository.findById(leadId);
		if (!leadResult.ok) return leadResult;
		if (leadResult.value === null) {
			return Result.error(new Error("LEAD_NOT_FOUND"));
		}

		const lead = leadResult.value;
		return Result.ok({
			message: this.messageTemplate.renderLinkedInMessage(lead),
			companyLinkedInUrl: lead.linkedin ?? undefined,
		});
	}
}
