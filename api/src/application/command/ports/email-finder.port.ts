export interface FindEmailsResult {
  emails: string[];
  pagesCrawled: number;
}

/**
 * Port for discovering emails on a domain (crawl contact/about pages).
 */
export interface EmailFinderPort {
  findEmailsForDomain(domain: string): Promise<FindEmailsResult>;
}
