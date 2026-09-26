/**
 * Normalise une URL ou un host en domaine canonique (ex. startup.com).
 * Utilisé pour dédupliquer les leads et faciliter la recherche d'emails.
 */
export function normalizeDomain(input: string): string {
	let url: URL;
	try {
		const trimmed = input.trim();
		const withProtocol = trimmed.includes("://")
			? trimmed
			: `https://${trimmed}`;
		url = new URL(withProtocol);
	} catch {
		return input.trim().toLowerCase();
	}
	const hostname = url.hostname.toLowerCase();
	if (hostname.startsWith("www.")) {
		return hostname.slice(4);
	}
	return hostname;
}
