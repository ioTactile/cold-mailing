import { describe, expect, it } from "vitest";
import {
	isLeadSource,
	LeadSource,
	type LeadSource as LeadSourceType,
	toLeadSource,
} from "@/domain/lead/lead.type.ts";

describe("lead.type", () => {
	it("isLeadSource retourne true pour une source valide", () => {
		expect(isLeadSource(LeadSource.WTTJ)).toBe(true);
	});

	it("isLeadSource retourne false pour une source invalide", () => {
		expect(isLeadSource("OTHER")).toBe(false);
	});

	it("toLeadSource retourne un LeadSource pour une valeur valide", () => {
		const value: LeadSourceType = toLeadSource("WTTJ");
		expect(value).toBe(LeadSource.WTTJ);
	});

	it("toLeadSource lance une erreur pour une valeur invalide", () => {
		expect(() => toLeadSource("OTHER")).toThrowError(
			"Source de prospects invalide: OTHER",
		);
	});

	it("LeadSource contient INDEED", () => {
		expect(LeadSource.INDEED).toBe("INDEED");
		expect(isLeadSource("INDEED")).toBe(true);
	});
});
