import { scrapeWttjJobs } from "@/adapters/secondary/scraper/WttjScraper.ts";
import type {
	JobBoardScraperPort,
	JobOffer,
	JobSearchLocation,
} from "@/application/command/ports/job-board-scraper.port.ts";

export class WttjJobBoardScraperAdapter implements JobBoardScraperPort {
	async search(
		query: string,
		limit: number,
		location?: JobSearchLocation,
	): Promise<JobOffer[]> {
		return scrapeWttjJobs(query, limit, location);
	}
}
