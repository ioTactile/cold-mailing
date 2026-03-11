import { describe, expect, it } from "vitest";
import {
	buildWttjSearchUrl,
	extractCompanySlugFromJobUrl,
} from "@/adapters/secondary/scraper/WttjScraper.ts";

describe("WttjScraper helpers", () => {
	it("extractCompanySlugFromJobUrl extrait le slug pour une URL standard WTTJ", () => {
		const url =
			"https://www.welcometothejungle.com/fr/companies/digital-associates/jobs/lead-developer_niort_DA_MyG8lMQ";
		expect(extractCompanySlugFromJobUrl(url)).toBe("digital-associates");
	});

	it("extractCompanySlugFromJobUrl extrait le slug pour une URL sans identifiant de job complexe", () => {
		const url =
			"https://www.welcometothejungle.com/fr/companies/link-consulting/jobs/developpeur-full-stack-net-react-h-f_saint-etienne";
		expect(extractCompanySlugFromJobUrl(url)).toBe("link-consulting");
	});

	it("extractCompanySlugFromJobUrl retourne une chaîne vide si le motif ne correspond pas", () => {
		const url = "https://www.welcometothejungle.com/fr/jobs?query=react";
		expect(extractCompanySlugFromJobUrl(url)).toBe("");
	});

	it("buildWttjSearchUrl construit une URL simple avec la requête", () => {
		const url = buildWttjSearchUrl("react");

		expect(url).toContain(
			"https://www.welcometothejungle.com/fr/jobs?query=react",
		);
		expect(url).not.toContain("aroundLatLng");
		expect(url).not.toContain("aroundRadius");
		expect(url).not.toContain("aroundQuery");
	});

	it("buildWttjSearchUrl permet de cibler une localisation avec lat/lng et rayon", () => {
		const url = buildWttjSearchUrl("développeur frontend", {
			label: "Rennes, Ille-et-Vilaine, Bretagne, France",
			radiusKm: 100,
			lat: 48.11198,
			lng: -1.67429,
		});

		expect(url).toContain(
			"https://www.welcometothejungle.com/fr/jobs?query=d%C3%A9veloppeur+frontend",
		);
		expect(url).toContain("refinementList%5Boffices.country_code%5D%5B%5D=FR");
		expect(url).toContain("aroundLatLng=48.11198%2C-1.67429");
		expect(url).toContain("aroundRadius=100");
		expect(url).toContain("aroundQuery=Rennes");
	});
});
