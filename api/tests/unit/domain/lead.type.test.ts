import { describe, expect, it } from "vitest";
import {
	buildLinkedinSearchQueries,
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

	it("buildLinkedinSearchQueries génère des URLs à partir du nom de compagnie", () => {
		const { linkedinCompanySearchUrl, linkedinPeopleSearchUrl } =
			buildLinkedinSearchQueries("Acme", "acme.com");

		expect(linkedinCompanySearchUrl).toContain(
			"linkedin.com/search/results/companies/",
		);
		expect(linkedinCompanySearchUrl).toContain("keywords=");
		expect(linkedinPeopleSearchUrl).toContain(
			"linkedin.com/search/results/people/",
		);
		expect(decodeURIComponent(linkedinPeopleSearchUrl)).toContain(
			"recruteur Acme",
		);
	});

	it("buildLinkedinSearchQueries utilise le domaine si la compagnie est vide", () => {
		const { linkedinCompanySearchUrl } = buildLinkedinSearchQueries(
			"",
			"startup.io",
		);

		expect(decodeURIComponent(linkedinCompanySearchUrl)).toContain("startup");
	});

	it("buildLinkedinSearchQueries échoue sans compagnie ni domaine", () => {
		expect(() => buildLinkedinSearchQueries("", "")).toThrowError(
			"Nom d'entreprise ou domaine requis pour générer une recherche LinkedIn.",
		);
	});
});
