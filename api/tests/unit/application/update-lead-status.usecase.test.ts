import { Result } from "typescript-result";
import { describe, expect, it, vi } from "vitest";
import { UpdateLeadStatusUsecase } from "@/application/command/usecases/lead/update-lead-status.usecase.ts";
import type { LeadRepository } from "@/domain/lead/lead.repository.ts";
import type { LeadType } from "@/domain/lead/lead.type.ts";
import { LeadStatus } from "@/domain/lead/lead.type.ts";

function createLead(overrides?: Partial<LeadType>): LeadType {
	return {
		id: "lead-1",
		company: "Acme",
		domain: "acme.com",
		email: null,
		linkedin: null,
		techStack: null,
		source: "WTTJ",
		status: LeadStatus.NEW,
		createdAt: new Date(),
		contactedAt: null,
		...overrides,
	};
}

describe("UpdateLeadStatusUsecase", () => {
	it("met à jour le statut d'un lead existant", async () => {
		const lead = createLead();
		const updated = createLead({ status: LeadStatus.INTERESTED });
		const repo: LeadRepository = {
			findAll: vi.fn(),
			findById: vi.fn().mockResolvedValue(Result.ok(lead)),
			findByDomain: vi.fn(),
			create: vi.fn(),
			update: vi.fn().mockResolvedValue(Result.ok(updated)),
			countContactedToday: vi.fn(),
			delete: vi.fn(),
		};

		const usecase = new UpdateLeadStatusUsecase(repo);
		const result = await usecase.execute("lead-1", LeadStatus.INTERESTED);

		expect(result.ok).toBe(true);
		expect(repo.update).toHaveBeenCalledWith({
			...lead,
			status: LeadStatus.INTERESTED,
		});
	});

	it("retourne LEAD_NOT_FOUND", async () => {
		const repo: LeadRepository = {
			findAll: vi.fn(),
			findById: vi.fn().mockResolvedValue(Result.ok(null)),
			findByDomain: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			countContactedToday: vi.fn(),
			delete: vi.fn(),
		};

		const usecase = new UpdateLeadStatusUsecase(repo);
		const result = await usecase.execute("missing", LeadStatus.CONTACTED);

		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toBe("LEAD_NOT_FOUND");
		expect(repo.update).not.toHaveBeenCalled();
	});
});
