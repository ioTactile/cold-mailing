import type { Result } from "typescript-result";
import type { LeadType } from "@/domain/lead/lead.type.ts";

export interface ListLeadsFilters {
	status?: LeadType["status"];
	source?: string;
	limit?: number;
	offset?: number;
}

/**
 * Repository pattern for lead operations.
 */
export interface LeadRepository {
	findAll(filters?: ListLeadsFilters): Promise<Result<LeadType[], Error>>;
	findById(id: string): Promise<Result<LeadType | null, Error>>;
	findByDomain(domain: string): Promise<Result<LeadType | null, Error>>;
	create(
		lead: Omit<LeadType, "id" | "createdAt" | "contactedAt">,
	): Promise<Result<LeadType, Error>>;
	update(lead: LeadType): Promise<Result<LeadType, Error>>;
	countContactedToday(): Promise<Result<number, Error>>;
	delete(id: string): Promise<Result<void, Error>>;
}
