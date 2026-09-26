import { scrapeIndeedJobs } from "@/adapters/secondary/scraper/IndeedScraper.ts";
import type {
	JobBoardScraperPort,
	JobOffer,
	JobSearchLocation,
} from "@/application/command/ports/job-board-scraper.port.ts";

export class IndeedJobBoardScraperAdapter implements JobBoardScraperPort {
	async search(
		query: string,
		limit: number,
		location?: JobSearchLocation,
	): Promise<JobOffer[]> {
		return scrapeIndeedJobs(query, limit, location);
	}
}
