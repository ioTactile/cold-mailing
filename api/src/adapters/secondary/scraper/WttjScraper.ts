import { chromium } from "@playwright/test";
import { LeadSource } from "@/domain/lead/lead.type.ts";
import { logger } from "@/pkg/logger/index.ts";

export interface WttjJobResult {
	companyName: string;
	companyWebsiteUrl: string;
	source: LeadSource;
}

const WTTJ_JOBS_BASE = "https://www.welcometothejungle.com/fr/jobs";
const DEFAULT_LIMIT = 20;

export function extractCompanySlugFromJobUrl(jobUrl: string): string {
	const match = jobUrl.match(/\/fr\/companies\/([^/]+)\/jobs/);
	return match ? match[1] : "";
}

/**
 * Scraper WTTJ :
 * - ouvre la page de résultats,
 * - récupère une liste de liens vers les pages d'offre (`fr/companies/.../jobs/...`),
 * - ouvre chaque page d'entreprise pour extraire le nom de l'entreprise et un lien externe vers son site.
 *
 * L'HTML de WTTJ pouvant évoluer, on loggue largement et on reste tolérant aux erreurs.
 */
export async function scrapeWttjJobs(
	query: string,
	limit: number = DEFAULT_LIMIT,
): Promise<WttjJobResult[]> {
	logger.info({ query, limit }, "[WTTJ] Démarrage du scraping des offres.");

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

		logger.info({ url }, "[WTTJ] Navigation vers la page de résultats.");

		await page.goto(url, { waitUntil: "domcontentloaded" });

		// Les cartes d'offres sont chargées côté client ; on attend qu'au moins un lien d'offre apparaisse.
		await page
			.waitForSelector('a[href*="/fr/companies/"][href*="/jobs/"]', {
				timeout: 10_000,
			})
			.catch((error) => {
				logger.warn(
					{ err: error },
					"[WTTJ] Aucun lien d'offre détecté avant le timeout (sélecteur companies/jobs).",
				);
			});

		// Extraire les liens vers les fiches d'offre (nouveau format WTTJ : /fr/companies/.../jobs/...)
		const jobLinks = await page.$$eval(
			'a[href*="/fr/companies/"][href*="/jobs/"]',
			(links) =>
				(links as HTMLAnchorElement[])
					.map((a) => a.href)
					.filter(
						(href) =>
							href.includes("/fr/companies/") && href.includes("/jobs/"),
					),
		);

		logger.info(
			{ totalLinks: jobLinks.length },
			"[WTTJ] Liens d'offres détectés sur la page de résultats.",
		);

		const uniqueJobLinks = [...new Set(jobLinks)].slice(0, limit);

		logger.info(
			{ uniqueLinks: uniqueJobLinks.length },
			"[WTTJ] Liens d'offres uniques conservés après filtrage et limite.",
		);

		for (const jobUrl of uniqueJobLinks) {
			if (results.length >= limit) break;
			try {
				logger.info({ jobUrl }, "[WTTJ] Traitement d'une fiche d'offre.");

				const companySlugFromUrl = extractCompanySlugFromJobUrl(jobUrl);

				let companyName = "";
				let companyWebsiteUrl = "";

				if (companySlugFromUrl) {
					const companyPageUrl = `https://www.welcometothejungle.com/fr/companies/${companySlugFromUrl}`;

					const companyPage = await browser.newPage();
					await companyPage.setDefaultTimeout(8_000);
					await companyPage.goto(companyPageUrl, {
						waitUntil: "domcontentloaded",
					});

					companyName = await companyPage
						.$eval(
							'[data-testid="company-name"], h1, h1 span',
							(el) => el.textContent?.trim() ?? "",
						)
						.catch(() => "");

					// Attendre que le lien "Voir le site" du header soit rendu par React, si présent.
					await companyPage
						.waitForSelector('a[data-testid="showcase-header-website-link"]', {
							timeout: 8_000,
						})
						.catch(() => {});

					// 1) Essayer de récupérer explicitement le lien "Voir le site" du header WTTJ,
					// qui pointe vers le vrai domaine de l'entreprise (ex: https://web-atrio.com)
					companyWebsiteUrl =
						(await companyPage
							.$eval(
								'a[data-testid="showcase-header-website-link"]',
								(a) => (a as HTMLAnchorElement).href,
							)
							.catch(() => "")) ||
						// 2) Fallback générique : prendre le premier lien externe, en priorisant
						// ceux qui contiennent un texte du type "Voir le site".
						(await companyPage
							.$$eval("a[href^='http']", (links) => {
								const anchors = links as HTMLAnchorElement[];

								const isExternal = (href: string) =>
									!href.includes("welcometothejungle.com");

								const prioritized = anchors.find((a) => {
									const text = a.innerText.toLowerCase();
									const href = a.href;
									return (
										isExternal(href) &&
										(text.includes("voir le site") ||
											text.includes("site web") ||
											text.includes("site internet") ||
											text.includes("website"))
									);
								});

								if (prioritized) return prioritized.href;

								const firstExternal = anchors.find((a) => isExternal(a.href));
								return firstExternal?.href ?? "";
							})
							.catch(() => ""));

					await companyPage.close();
				}

				if (!companyName && companySlugFromUrl) {
					companyName = companySlugFromUrl;
				}
				if (!companyWebsiteUrl && companySlugFromUrl) {
					companyWebsiteUrl = `https://www.welcometothejungle.com/fr/companies/${companySlugFromUrl}`;
				}

				if (companyName.trim() && companyWebsiteUrl) {
					const trimmedName = companyName.trim();
					const trimmedUrl = companyWebsiteUrl.trim();

					logger.info(
						{
							companyName: trimmedName,
							companyWebsiteUrl: trimmedUrl,
						},
						"[WTTJ] Entreprise extraite depuis une fiche d'offre.",
					);

					results.push({
						companyName: trimmedName,
						companyWebsiteUrl: trimmedUrl,
						source: LeadSource.WTTJ,
					});
				} else {
					logger.info(
						{
							companyName,
							companyWebsiteUrl,
						},
						"[WTTJ] Fiche d'offre ignorée car informations incomplètes (nom ou site manquant).",
					);
				}
			} catch (error) {
				logger.warn(
					{ err: error, jobUrl },
					"[WTTJ] Erreur lors du traitement d'une fiche d'offre individuelle, fiche ignorée.",
				);
			}
		}

		logger.info(
			{ resultsCount: results.length },
			"[WTTJ] Fin du scraping, entreprises extraites.",
		);
	} catch (error) {
		logger.error(
			{ err: error, query, limit },
			"[WTTJ] Erreur pendant le scraping global des offres.",
		);
		throw error;
	} finally {
		await browser.close();
	}

	return results;
}
