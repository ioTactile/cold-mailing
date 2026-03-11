import { describe, expect, it } from "vitest";
import {
	buildIndeedSearchUrl,
	extractCompanyFromIndeedLdJsonScripts,
} from "@/adapters/secondary/scraper/IndeedScraper.ts";

describe("IndeedScraper helpers", () => {
	it("buildIndeedSearchUrl construit une URL de recherche en France", () => {
		const url = buildIndeedSearchUrl("React");

		expect(url).toContain("https://fr.indeed.com/jobs");
		expect(url).toContain("q=React");
		expect(url).toContain("l=France");
	});

	it("extractCompanyFromIndeedLdJsonScripts extrait nom et site depuis un JobPosting simple", () => {
		const scripts = [
			JSON.stringify({
				"@type": "JobPosting",
				hiringOrganization: {
					name: "Ma Startup",
					sameAs: "https://ma-startup.fr",
				},
			}),
		];

		const result = extractCompanyFromIndeedLdJsonScripts(scripts);

		expect(result).not.toBeNull();
		expect(result?.companyName).toBe("Ma Startup");
		expect(result?.companyWebsiteUrl).toBe("https://ma-startup.fr");
	});

	it("extractCompanyFromIndeedLdJsonScripts ignore les scripts sans JobPosting valable", () => {
		const scripts = [
			JSON.stringify({
				"@type": "Organization",
				name: "Autre chose",
			}),
		];

		const result = extractCompanyFromIndeedLdJsonScripts(scripts);

		expect(result).toBeNull();
	});
});
