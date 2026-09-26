import { chromium } from '@playwright/test';
import { LeadSource } from '@/domain/lead/lead.type.ts';
import { logger } from '@/pkg/logger/index.ts';

export interface IndeedJobResult {
  companyName: string;
  companyWebsiteUrl: string;
  source: LeadSource;
}

export interface IndeedSearchLocation {
  /**
   * Location label used by Indeed (e.g. "Rennes (35)", "Paris (75)").
   */
  label?: string;
  /**
   * Search radius in kilometers (Indeed `radius` parameter).
   */
  radiusKm?: number;
}

const INDEED_JOBS_BASE = 'https://fr.indeed.com/jobs';
const DEFAULT_LIMIT = 20;

/**
 * Build the Indeed search URL for a given query.
 */
export function buildIndeedSearchUrl(query: string, location?: IndeedSearchLocation): string {
  const searchParams = new URLSearchParams({
    q: query,
    l: location?.label ?? 'France',
  });

  if (location?.radiusKm && Number.isFinite(location.radiusKm)) {
    searchParams.set('radius', String(location.radiusKm));
  }

  return `${INDEED_JOBS_BASE}?${searchParams.toString()}`;
}

export interface IndeedCompanyInfo {
  companyName: string;
  companyWebsiteUrl: string;
}

/**
 * Extract company info (name + website) from JSON-LD
 * `application/ld+json` scripts on an Indeed job page.
 *
 * Targets `JobPosting` objects and reads `hiringOrganization`.
 */
export function extractCompanyFromIndeedLdJsonScripts(scripts: string[]): IndeedCompanyInfo | null {
  for (const raw of scripts) {
    const text = raw?.trim();
    if (!text) continue;

    try {
      const parsed = JSON.parse(text) as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const rawItem of items) {
        if (!rawItem || typeof rawItem !== 'object') continue;

        const item = rawItem as {
          '@type'?: string | string[];
          hiringOrganization?:
            | {
                name?: unknown;
                sameAs?: unknown;
                url?: unknown;
              }
            | {
                name?: unknown;
                sameAs?: unknown;
                url?: unknown;
              }[];
        };

        const type = item['@type'];
        const isJobPosting =
          type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'));

        if (!isJobPosting) continue;

        const hiringOrgRaw = item.hiringOrganization;
        if (!hiringOrgRaw) continue;

        const hiringOrg = Array.isArray(hiringOrgRaw) ? hiringOrgRaw[0] : hiringOrgRaw;
        if (!hiringOrg || typeof hiringOrg !== 'object') continue;

        const nameValue = (hiringOrg as { name?: unknown }).name;
        const sameAsValue = (hiringOrg as { sameAs?: unknown }).sameAs;
        const urlValue = (hiringOrg as { url?: unknown }).url;

        const name = typeof nameValue === 'string' ? nameValue.trim() : '';
        const sameAs = typeof sameAsValue === 'string' ? sameAsValue.trim() : '';
        const url = typeof urlValue === 'string' ? urlValue.trim() : '';

        const companyName = name;
        const companyWebsiteUrl = sameAs || url;

        if (companyName || companyWebsiteUrl) {
          return {
            companyName,
            companyWebsiteUrl,
          };
        }
      }
    } catch (error) {
      logger.warn(
        { err: error },
        "[INDEED] Erreur lors de l'extraction des informations de l'entreprise.",
      );
      continue;
    }
  }

  return null;
}

/**
 * Indeed scraper:
 * - opens the results page,
 * - collects links to job pages (`viewjob` / `vjk`),
 * - opens each job page to extract the company name and an external website link.
 *
 * Indeed HTML can change, so we log heavily and stay tolerant of errors.
 */
export async function scrapeIndeedJobs(
  query: string,
  limit: number = DEFAULT_LIMIT,
  location?: IndeedSearchLocation,
): Promise<IndeedJobResult[]> {
  logger.info({ query, limit }, '[INDEED] Démarrage du scraping des offres.');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results: IndeedJobResult[] = [];

  try {
    const page = await browser.newPage();
    await page.setDefaultTimeout(15_000);

    const url = buildIndeedSearchUrl(query, location);
    logger.info({ url }, '[INDEED] Navigation vers la page de résultats.');

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Give the SPA time to render job cards.
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    // Collect links to job detail pages.
    const jobLinks = await page
      .$$eval('a[href*="viewjob"], a[href*="vjk="], a[href*="/rc/clk"], [data-jk]', (elements) => {
        const urls = new Set<string>();
        const base = 'https://fr.indeed.com';

        for (const el of elements as HTMLElement[]) {
          // 1) Classic link (viewjob, rc/clk, etc.)
          if (el instanceof HTMLAnchorElement) {
            const rawHref = el.href || el.getAttribute('href') || '';
            if (!rawHref) continue;
            if (rawHref.startsWith('http')) {
              urls.add(rawHref);
            } else if (rawHref.startsWith('/')) {
              urls.add(`${base}${rawHref}`);
            }
            continue;
          }

          // 2) Card with data-jk only: rebuild the viewjob URL.
          const jk = el.getAttribute('data-jk');
          if (jk) {
            urls.add(`${base}/viewjob?jk=${jk}`);
          }
        }

        return Array.from(urls);
      })
      .catch((error) => {
        logger.warn({ err: error }, "[INDEED] Erreur lors de l'extraction des liens d'offres.");
        return [] as string[];
      });

    logger.info(
      { totalLinks: jobLinks.length },
      "[INDEED] Liens d'offres détectés sur la page de résultats.",
    );

    const uniqueJobLinks = [...new Set(jobLinks)].slice(0, limit);

    logger.info(
      { uniqueLinks: uniqueJobLinks.length },
      "[INDEED] Liens d'offres uniques conservés après filtrage et limite.",
    );

    for (const jobUrl of uniqueJobLinks) {
      if (results.length >= limit) break;
      try {
        logger.info({ jobUrl }, "[INDEED] Traitement d'une fiche d'offre.");

        const jobPage = await browser.newPage();
        await jobPage.setDefaultTimeout(12_000);
        await jobPage.goto(jobUrl, { waitUntil: 'domcontentloaded' });

        // 1) Try JSON-LD (JobPosting / hiringOrganization).
        const ldJsonScripts = await jobPage.$$eval(
          'script[type="application/ld+json"]',
          (scripts) =>
            scripts.map((s) => s.textContent ?? '').filter((content) => Boolean(content?.trim())),
        );

        const fromLdJson = extractCompanyFromIndeedLdJsonScripts(ldJsonScripts);

        let companyName = fromLdJson?.companyName ?? '';
        let companyWebsiteUrl = fromLdJson?.companyWebsiteUrl ?? '';

        // 2) DOM fallback for company name when JSON-LD is incomplete.
        if (!companyName) {
          companyName =
            (await jobPage
              .$eval(
                'span.companyName, [data-testid="company-name"], .jobsearch-CompanyReview--heading',
                (el) => el.textContent?.trim() ?? '',
              )
              .catch(() => '')) || '';
        }

        // 3) DOM fallback for website when JSON-LD is incomplete or points at Indeed.
        const isIndeedUrl =
          companyWebsiteUrl && /company|indeed\./i.test(new URL(companyWebsiteUrl).hostname);

        if (!companyWebsiteUrl || isIndeedUrl) {
          companyWebsiteUrl =
            (await jobPage
              .$$eval("a[href^='http']", (links) => {
                const anchors = links as HTMLAnchorElement[];

                const blockedHosts = [
                  'indeed.com',
                  'www.indeed.com',
                  'fr.indeed.com',
                  'google.com',
                  'www.google.com',
                  'facebook.com',
                  'www.facebook.com',
                  'linkedin.com',
                  'www.linkedin.com',
                ];

                const isExternalCompanyLink = (href: string) => {
                  try {
                    const url = new URL(href);
                    return !blockedHosts.includes(url.hostname);
                  } catch {
                    return false;
                  }
                };

                const prioritized = anchors.find((a) => {
                  const text = a.innerText.toLowerCase();
                  const href = a.href;
                  return (
                    isExternalCompanyLink(href) &&
                    (text.includes('site web') ||
                      text.includes('website') ||
                      text.includes('voir le site') ||
                      text.includes('site internet'))
                  );
                });

                if (prioritized) return prioritized.href;

                const firstExternal = anchors.find((a) => isExternalCompanyLink(a.href));
                return firstExternal?.href ?? '';
              })
              .catch(() => '')) ?? '';
        }

        await jobPage.close();

        if (companyName.trim() && companyWebsiteUrl.trim()) {
          const trimmedName = companyName.trim();
          const trimmedUrl = companyWebsiteUrl.trim();

          logger.info(
            {
              companyName: trimmedName,
              companyWebsiteUrl: trimmedUrl,
            },
            "[INDEED] Entreprise extraite depuis une fiche d'offre.",
          );

          results.push({
            companyName: trimmedName,
            companyWebsiteUrl: trimmedUrl,
            source: LeadSource.INDEED,
          });
        } else {
          logger.info(
            {
              companyName,
              companyWebsiteUrl,
            },
            "[INDEED] Fiche d'offre ignorée car informations incomplètes (nom ou site manquant).",
          );
        }
      } catch (error) {
        logger.warn(
          { err: error, jobUrl },
          "[INDEED] Erreur lors du traitement d'une fiche d'offre individuelle, fiche ignorée.",
        );
      }
    }

    logger.info(
      { resultsCount: results.length },
      '[INDEED] Fin du scraping, entreprises extraites.',
    );
  } catch (error) {
    logger.error(
      { err: error, query, limit },
      '[INDEED] Erreur pendant le scraping global des offres.',
    );
    throw error;
  } finally {
    await browser.close();
  }

  return results;
}
