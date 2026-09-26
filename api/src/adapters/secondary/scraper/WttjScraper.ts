import { chromium } from '@playwright/test';
import { LeadSource } from '@/domain/lead/lead.type.ts';
import { logger } from '@/pkg/logger/index.ts';

export interface WttjJobResult {
  companyName: string;
  companyWebsiteUrl: string;
  source: LeadSource;
}

export interface WttjSearchLocation {
  /**
   * Human-readable location label (WTTJ: `aroundQuery`),
   * e.g. "Rennes, Ille-et-Vilaine, Bretagne, France".
   */
  label?: string;
  /**
   * Search radius in kilometers (WTTJ: `aroundRadius`).
   */
  radiusKm?: number;
  /**
   * Coordinates for `aroundLatLng` (lat, lng).
   */
  lat?: number;
  lng?: number;
}

const WTTJ_JOBS_BASE = 'https://www.welcometothejungle.com/fr/jobs';
const DEFAULT_LIMIT = 20;

export function buildWttjSearchUrl(query: string, location?: WttjSearchLocation): string {
  const searchParams = new URLSearchParams({ query });

  if (location) {
    // Default to France via the WTTJ location filter.
    searchParams.append('refinementList[offices.country_code][]', 'FR');

    if (
      typeof location.lat === 'number' &&
      Number.isFinite(location.lat) &&
      typeof location.lng === 'number' &&
      Number.isFinite(location.lng)
    ) {
      searchParams.set('aroundLatLng', `${location.lat},${location.lng}`);
    }

    if (location.radiusKm && Number.isFinite(location.radiusKm)) {
      searchParams.set('aroundRadius', String(location.radiusKm));
    }

    if (location.label) {
      searchParams.set('aroundQuery', location.label);
    }
  }

  return `${WTTJ_JOBS_BASE}?${searchParams.toString()}`;
}

export function extractCompanySlugFromJobUrl(jobUrl: string): string {
  const match = jobUrl.match(/\/fr\/companies\/([^/]+)\/jobs/);
  return match ? match[1] : '';
}

/**
 * WTTJ scraper:
 * - opens the results page,
 * - collects links to job pages (`fr/companies/.../jobs/...`),
 * - opens each company page to extract the company name and an external website link.
 *
 * WTTJ HTML can change, so we log heavily and stay tolerant of errors.
 */
export async function scrapeWttjJobs(
  query: string,
  limit: number = DEFAULT_LIMIT,
  location?: WttjSearchLocation,
): Promise<WttjJobResult[]> {
  logger.info({ query, limit }, '[WTTJ] Démarrage du scraping des offres.');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results: WttjJobResult[] = [];
  try {
    const page = await browser.newPage();
    await page.setDefaultTimeout(15_000);

    const url = buildWttjSearchUrl(query, location);

    logger.info({ url }, '[WTTJ] Navigation vers la page de résultats.');

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Job cards are client-rendered; wait until at least one job link appears.
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

    // Collect job detail links (WTTJ format: /fr/companies/.../jobs/...)
    const jobLinks = await page.$$eval('a[href*="/fr/companies/"][href*="/jobs/"]', (links) =>
      (links as HTMLAnchorElement[])
        .map((a) => a.href)
        .filter((href) => href.includes('/fr/companies/') && href.includes('/jobs/')),
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

        let companyName = '';
        let companyWebsiteUrl = '';

        if (companySlugFromUrl) {
          const companyPageUrl = `https://www.welcometothejungle.com/fr/companies/${companySlugFromUrl}`;

          const companyPage = await browser.newPage();
          await companyPage.setDefaultTimeout(8_000);
          await companyPage.goto(companyPageUrl, {
            waitUntil: 'domcontentloaded',
          });

          companyName = await companyPage
            .$eval(
              '[data-testid="company-name"], h1, h1 span',
              (el) => el.textContent?.trim() ?? '',
            )
            .catch(() => '');

          // Wait for the header "Voir le site" link to be rendered by React, if present.
          await companyPage
            .waitForSelector('a[data-testid="showcase-header-website-link"]', {
              timeout: 8_000,
            })
            .catch(() => {});

          // 1) Prefer the explicit header "Voir le site" link on WTTJ,
          // which points at the real company domain (e.g. https://web-atrio.com)
          companyWebsiteUrl =
            (await companyPage
              .$eval(
                'a[data-testid="showcase-header-website-link"]',
                (a) => (a as HTMLAnchorElement).href,
              )
              .catch(() => '')) ||
            // 2) Generic fallback: take the first external link, preferring
            // ones whose text looks like "Voir le site".
            (await companyPage
              .$$eval("a[href^='http']", (links) => {
                const anchors = links as HTMLAnchorElement[];

                const isExternal = (href: string) => !href.includes('welcometothejungle.com');

                const prioritized = anchors.find((a) => {
                  const text = a.innerText.toLowerCase();
                  const href = a.href;
                  return (
                    isExternal(href) &&
                    (text.includes('voir le site') ||
                      text.includes('site web') ||
                      text.includes('site internet') ||
                      text.includes('website'))
                  );
                });

                if (prioritized) return prioritized.href;

                const firstExternal = anchors.find((a) => isExternal(a.href));
                return firstExternal?.href ?? '';
              })
              .catch(() => ''));

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

    logger.info({ resultsCount: results.length }, '[WTTJ] Fin du scraping, entreprises extraites.');
  } catch (error) {
    logger.error(
      { err: error, query, limit },
      '[WTTJ] Erreur pendant le scraping global des offres.',
    );
    throw error;
  } finally {
    await browser.close();
  }

  return results;
}
