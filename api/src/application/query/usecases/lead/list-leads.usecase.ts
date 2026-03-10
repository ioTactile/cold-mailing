import type { Result } from "typescript-result";
import type {
	LeadRepository,
	ListLeadsFilters,
} from "@/domain/lead/lead.repository.ts";
import type { LeadType } from "@/domain/lead/lead.type.ts";

export class ListLeadsUsecase {
	private readonly leadRepository: LeadRepository;

	constructor(leadRepository: LeadRepository) {
		this.leadRepository = leadRepository;
	}

	async execute(
		filters?: ListLeadsFilters,
	): Promise<Result<LeadType[], Error>> {
		return this.leadRepository.findAll(filters);
	}
}
