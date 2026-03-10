const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi;

const PATHS_TO_CRAWL = [
	"/contact",
	"/about",
	"/about-us",
	"/team",
	"/legal",
	"/mentions-legales",
	"/contact-us",
];

const MAX_PAGES = 6;
const FETCH_TIMEOUT_MS = 8_000;

function extractEmailsFromText(text: string): string[] {
	const matches = text.match(EMAIL_REGEX) ?? [];
	const normalized = matches.map((e) => e.toLowerCase().trim());
	return [...new Set(normalized)];
}

function extractMailtoHrefs(html: string): string[] {
	const mailtoRegex = /href=["']mailto:([^"'\s?]+)/gi;
	const emails: string[] = [];
	let m = mailtoRegex.exec(html);
	while (m !== null) {
		const email = m?.[1]?.split("?")[0].trim().toLowerCase();
		if (email?.includes("@")) emails.push(email);
		m = mailtoRegex.exec(html);
	}
	return [...new Set(emails)];
}

/**
 * Récupère le contenu d'une URL en GET avec un timeout.
 * Pas de rendu JS ; les sites SPA peuvent ne pas exposer les emails.
 */
async function fetchPageText(url: string): Promise<string> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			signal: controller.signal,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; ColdMailingBot/1.0; +https://cold-mailing.local)",
			},
			redirect: "follow",
		});
		clearTimeout(timeout);
		if (!res.ok) return "";
		return await res.text();
	} catch {
		clearTimeout(timeout);
		return "";
	}
}

export interface FindEmailsResult {
	emails: string[];
	pagesCrawled: number;
}

/**
 * Crawle les pages typiques d'un domaine (contact, about, etc.) et extrait
 * les adresses email (regex + mailto). Limite le nombre de pages et le timeout.
 */
export async function findEmailsForDomain(
	domain: string,
	useHttps = true,
): Promise<FindEmailsResult> {
	const protocol = useHttps ? "https" : "http";
	const baseUrl = `${protocol}://${domain}`;
	const allEmails = new Set<string>();

	let pagesCrawled = 0;
	for (const path of PATHS_TO_CRAWL) {
		if (pagesCrawled >= MAX_PAGES) break;
		const url = `${baseUrl}${path}`;
		const html = await fetchPageText(url);
		if (!html) continue;
		pagesCrawled += 1;
		const fromRegex = extractEmailsFromText(html);
		const fromMailto = extractMailtoHrefs(html);
		for (const e of [...fromRegex, ...fromMailto]) {
			if (e.endsWith(domain) || e.includes("@")) allEmails.add(e);
		}
	}

	return {
		emails: [...allEmails],
		pagesCrawled,
	};
}
