import { Result } from "typescript-result";
import { describe, expect, it, vi } from "vitest";
import type { MessageTemplatePort } from "@/application/command/ports/message-template.port.ts";
import { GetLinkedInMessageForLeadUsecase } from "@/application/command/usecases/lead/get-linkedin-message-for-lead.usecase.ts";
import type { LeadRepository } from "@/domain/lead/lead.repository.ts";
import type { LeadType } from "@/domain/lead/lead.type.ts";
import { LeadStatus } from "@/domain/lead/lead.type.ts";

describe("GetLinkedInMessageForLeadUsecase", () => {
	it("retourne le message rendu pour un lead existant", async () => {
		const lead: LeadType = {
			id: "1",
			company: "Acme",
			domain: "acme.com",
			email: null,
			linkedin: "https://linkedin.com/company/acme",
			techStack: null,
			source: "WTTJ",
			status: LeadStatus.NEW,
			createdAt: new Date(),
			contactedAt: null,
		};
		const repo: LeadRepository = {
			findAll: vi.fn(),
			findById: vi.fn().mockResolvedValue(Result.ok(lead)),
			findByDomain: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			countContactedToday: vi.fn(),
			delete: vi.fn(),
		};
		const template: MessageTemplatePort = {
			renderColdEmail: vi.fn(),
			renderLinkedInMessage: vi.fn().mockReturnValue("Bonjour Acme"),
		};

		const usecase = new GetLinkedInMessageForLeadUsecase(repo, template);
		const result = await usecase.execute("1");

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.message).toBe("Bonjour Acme");
			expect(result.value.companyLinkedInUrl).toBe(
				"https://linkedin.com/company/acme",
			);
		}
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
		const usecase = new GetLinkedInMessageForLeadUsecase(repo, {
			renderColdEmail: vi.fn(),
			renderLinkedInMessage: vi.fn(),
		});

		const result = await usecase.execute("missing");
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toBe("LEAD_NOT_FOUND");
	});
});
