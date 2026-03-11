import { Result } from "typescript-result";
import type { LeadRepository } from "@/domain/lead/lead.repository.ts";
import type { LeadType, LinkedinSearchUrls } from "@/domain/lead/lead.type.ts";
import { buildLinkedinSearchQueries } from "@/domain/lead/lead.type.ts";

type LeadWithLinkedinSearch = LeadType & LinkedinSearchUrls;

export class GetLeadByIdUsecase {
	private readonly leadRepository: LeadRepository;

	constructor(leadRepository: LeadRepository) {
		this.leadRepository = leadRepository;
	}

	async execute(
		id: string,
	): Promise<Result<LeadWithLinkedinSearch | null, Error>> {
		const result = await this.leadRepository.findById(id);

		if (!result.ok) {
			return result;
		}

		if (result.value === null) {
			return Result.ok(null);
		}

		const lead = result.value;
		const enriched: LeadWithLinkedinSearch = {
			...lead,
			...buildLinkedinSearchQueries(lead.company, lead.domain),
		};

		return Result.ok(enriched);
	}
}
