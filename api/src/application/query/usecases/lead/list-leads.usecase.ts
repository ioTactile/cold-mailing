import { Result } from "typescript-result";
import type {
	LeadRepository,
	ListLeadsFilters,
} from "@/domain/lead/lead.repository.ts";
import type { LeadType, LinkedinSearchUrls } from "@/domain/lead/lead.type.ts";
import { buildLinkedinSearchQueries } from "@/domain/lead/lead.type.ts";

type LeadWithLinkedinSearch = LeadType & LinkedinSearchUrls;

export class ListLeadsUsecase {
	private readonly leadRepository: LeadRepository;

	constructor(leadRepository: LeadRepository) {
		this.leadRepository = leadRepository;
	}

	async execute(
		filters?: ListLeadsFilters,
	): Promise<Result<LeadWithLinkedinSearch[], Error>> {
		const result = await this.leadRepository.findAll(filters);

		if (!result.ok) {
			return result;
		}

		const enriched = result.value.map((lead) => ({
			...lead,
			...buildLinkedinSearchQueries(lead.company, lead.domain),
		}));

		return Result.ok(enriched);
	}
}
