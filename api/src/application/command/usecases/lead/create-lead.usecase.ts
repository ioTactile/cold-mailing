import type { Result } from "typescript-result";
import type { LeadRepository } from "@/domain/lead/lead.repository.ts";
import type { CreateLeadInputType, LeadType } from "@/domain/lead/lead.type.ts";
import { LeadStatus } from "@/domain/lead/lead.type.ts";

export class CreateLeadUsecase {
	private readonly leadRepository: LeadRepository;

	constructor(leadRepository: LeadRepository) {
		this.leadRepository = leadRepository;
	}

	async execute(input: CreateLeadInputType): Promise<Result<LeadType, Error>> {
		const leadData: Omit<LeadType, "id" | "createdAt" | "contactedAt"> = {
			company: input.company,
			domain: input.domain,
			email: input.email ?? null,
			linkedin: input.linkedin ?? null,
			techStack: input.techStack ?? null,
			source: input.source,
			status: input.status ?? LeadStatus.NEW,
		};
		return this.leadRepository.create(leadData);
	}
}
