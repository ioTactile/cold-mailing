import { describe, expect, it } from "vitest";
import {
	createLeadBodySchema,
	discoverLeadsBodySchema,
	listLeadsQuerySchema,
	updateLeadStatusBodySchema,
} from "@/adapters/primary/http/schemas/lead.schemas.ts";

describe("lead.schemas", () => {
	describe("createLeadBodySchema", () => {
		it("valide un body correct avec source WTTJ", () => {
			const result = createLeadBodySchema.safeParse({
				company: "Acme",
				domain: "acme.com",
				email: "contact@acme.com",
				linkedin: "https://linkedin.com/company/acme",
				techStack: "React, Next.js",
				source: "WTTJ",
				status: "NEW",
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.source).toBe("WTTJ");
			}
		});

		it("rejette une source invalide", () => {
			const result = createLeadBodySchema.safeParse({
				company: "Acme",
				domain: "acme.com",
				source: "OTHER",
			});

			expect(result.success).toBe(false);
		});
	});

	describe("discoverLeadsBodySchema", () => {
		it("valide un body correct", () => {
			const result = discoverLeadsBodySchema.safeParse({
				source: "WTTJ",
				query: "React",
				limit: 10,
			});

			expect(result.success).toBe(true);
		});
	});

	describe("updateLeadStatusBodySchema", () => {
		it("valide un statut correct", () => {
			const result = updateLeadStatusBodySchema.safeParse({
				status: "NEW",
			});

			expect(result.success).toBe(true);
		});
	});

	describe("listLeadsQuerySchema", () => {
		it("valide une requête avec filtres", () => {
			const result = listLeadsQuerySchema.safeParse({
				status: "NEW",
				source: "any-source",
				limit: 10,
				offset: 0,
			});

			expect(result.success).toBe(true);
		});
	});
});
