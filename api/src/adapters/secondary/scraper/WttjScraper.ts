import { chromium } from "@playwright/test";

export interface WttjJobResult {
	companyName: string;
	companyWebsiteUrl: string;
	source: "WTTJ";
}

const WTTJ_JOBS_BASE = "https://www.welcometothejungle.com/fr/jobs";
const DEFAULT_LIMIT = 20;

/**
 * Lance le navigateur Playwright, exécute la recherche WTTJ, extrait les entreprises.
 * Retourne au plus `limit` résultats.
 */
export async function scrapeWttjJobs(
	query: string,
	limit: number = DEFAULT_LIMIT,
): Promise<WttjJobResult[]> {
	const browser = await chromium.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	const results: WttjJobResult[] = [];
	try {
		const page = await browser.newPage();
		await page.setDefaultTimeout(15_000);

		const searchParams = new URLSearchParams({ query });
		const url = `${WTTJ_JOBS_BASE}?${searchParams.toString()}`;
		await page.goto(url, { waitUntil: "domcontentloaded" });

		await page.waitForLoadState("domcontentloaded").catch(() => null);

		// Extraire les liens vers les fiches d'offre (format WTTJ: /fr/jobs/xxx)
		const jobLinks = await page.$$eval('a[href*="/fr/jobs/"]', (links) =>
			links
				.map((a) => (a as HTMLAnchorElement).href)
				.filter(
					(href) =>
						href.includes("/fr/jobs/") &&
						!href.includes("/companies/") &&
						href !== "https://www.welcometothejungle.com/fr/jobs",
				),
		);

		const uniqueJobLinks = [...new Set(jobLinks)].slice(0, limit);

		for (const jobUrl of uniqueJobLinks) {
			if (results.length >= limit) break;
			try {
				const jobPage = await browser.newPage();
				await jobPage.setDefaultTimeout(8_000);
				await jobPage.goto(jobUrl, { waitUntil: "domcontentloaded" });

				// Nom entreprise : souvent dans un lien vers /companies/ ou data-testid
				const companyName =
					(await jobPage
						.$eval(
							'a[href*="/companies/"]',
							(el) => (el as HTMLAnchorElement).textContent?.trim() ?? "",
						)
						.catch(() => "")) ||
					(await jobPage
						.$eval(
							'[data-testid="company-name"], .company-name, [class*="company"]',
							(el) => (el as HTMLElement).textContent?.trim() ?? "",
						)
						.catch(() => ""));

				// Site web entreprise : premier lien externe (hors WTTJ) ou page entreprise WTTJ
				let companyWebsiteUrl = "";
				const wttj = "welcometothejungle.com";
				const externalLinks = await jobPage.$$eval(
					'a[href^="http"]',
					(links, w) => {
						return (links as HTMLAnchorElement[])
							.map((a) => a.href)
							.filter((href) => href && !href.includes(w));
					},
					wttj,
				);
				if (externalLinks.length > 0) {
					companyWebsiteUrl = externalLinks[0];
				}

				if (!companyWebsiteUrl && companyName) {
					const companySlug = await jobPage
						.$eval('a[href*="/companies/"]', (a) => {
							const href = (a as HTMLAnchorElement).href;
							const m = href.match(/\/companies\/([^/?#]+)/);
							return m ? m[1] : "";
						})
						.catch(() => "");
					if (companySlug) {
						companyWebsiteUrl = `https://www.welcometothejungle.com/fr/companies/${companySlug}`;
					}
				}

				await jobPage.close();

				if (companyName.trim() && companyWebsiteUrl) {
					results.push({
						companyName: companyName.trim(),
						companyWebsiteUrl: companyWebsiteUrl.trim(),
						source: "WTTJ",
					});
				}
			} catch {
				// Ignorer les erreurs sur une fiche individuelle
			}
		}
	} finally {
		await browser.close();
	}

	return results;
}
