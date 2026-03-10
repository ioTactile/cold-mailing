import type { Result } from "typescript-result";
import type { LeadRepository } from "@/domain/lead/lead.repository.ts";
import type { LeadType } from "@/domain/lead/lead.type.ts";

export class GetLeadByIdUsecase {
	private readonly leadRepository: LeadRepository;

	constructor(leadRepository: LeadRepository) {
		this.leadRepository = leadRepository;
	}

	async execute(id: string): Promise<Result<LeadType | null, Error>> {
		return this.leadRepository.findById(id);
	}
}
