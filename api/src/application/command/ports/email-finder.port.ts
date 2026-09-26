export interface FindEmailsResult {
	emails: string[];
	pagesCrawled: number;
}

/**
 * Port pour la découverte d'emails sur un domaine (crawl pages contact/about).
 */
export interface EmailFinderPort {
	findEmailsForDomain(domain: string): Promise<FindEmailsResult>;
}
