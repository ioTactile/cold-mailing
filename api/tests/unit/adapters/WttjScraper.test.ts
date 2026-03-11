import { describe, expect, it } from "vitest";
import { extractCompanySlugFromJobUrl } from "@/adapters/secondary/scraper/WttjScraper.ts";

describe("extractCompanySlugFromJobUrl", () => {
	it("extrait le slug pour une URL standard WTTJ", () => {
		const url =
			"https://www.welcometothejungle.com/fr/companies/digital-associates/jobs/lead-developer_niort_DA_MyG8lMQ";
		expect(extractCompanySlugFromJobUrl(url)).toBe("digital-associates");
	});

	it("extrait le slug pour une URL sans identifiant de job complexe", () => {
		const url =
			"https://www.welcometothejungle.com/fr/companies/link-consulting/jobs/developpeur-full-stack-net-react-h-f_saint-etienne";
		expect(extractCompanySlugFromJobUrl(url)).toBe("link-consulting");
	});

	it("retourne une chaîne vide si le motif ne correspond pas", () => {
		const url = "https://www.welcometothejungle.com/fr/jobs?query=react";
		expect(extractCompanySlugFromJobUrl(url)).toBe("");
	});
});
