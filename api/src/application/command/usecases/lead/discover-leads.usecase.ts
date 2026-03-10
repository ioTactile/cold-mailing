import { scrapeWttjJobs } from "@/adapters/secondary/scraper/WttjScraper.ts";
import type { CreateLeadUsecase } from "@/application/command/usecases/lead/create-lead.usecase.ts";
import type { LeadRepository } from "@/domain/lead/lead.repository.ts";
import type { LeadType } from "@/domain/lead/lead.type.ts";
import { LeadStatus } from "@/domain/lead/lead.type.ts";
import { normalizeDomain } from "@/pkg/domain/normalize-domain.ts";
import { findEmailsForDomain } from "@/pkg/email-finder/find-emails.ts";

export type DiscoverSource = "WTTJ";

export interface DiscoverLeadsOptions {
	source: DiscoverSource;
	query?: string;
	limit?: number;
}

export type DiscoverEvent =
	| { type: "step"; message: string }
	| { type: "lead_created"; lead: LeadType }
	| { type: "skip"; reason: string; company?: string }
	| { type: "done"; created: number; skipped: number }
	| { type: "error"; message: string };

const WTTJ_DOMAIN = "welcometothejungle.com";

export class DiscoverLeadsUsecase {
	private readonly leadRepository: LeadRepository;
	private readonly createLeadUsecase: CreateLeadUsecase;

	constructor(
		leadRepository: LeadRepository,
		createLeadUsecase: CreateLeadUsecase,
	) {
		this.leadRepository = leadRepository;
		this.createLeadUsecase = createLeadUsecase;
	}

	async execute(
		options: DiscoverLeadsOptions,
		onEvent: (event: DiscoverEvent) => void,
	): Promise<void> {
		const { source, query = "React", limit = 20 } = options;
		let created = 0;
		let skipped = 0;

		try {
			onEvent({
				type: "step",
				message: `Scraping ${source} (query: ${query})…`,
			});

			const jobs = source === "WTTJ" ? await scrapeWttjJobs(query, limit) : [];

			onEvent({
				type: "step",
				message: `${jobs.length} entreprise(s) trouvée(s). Extraction des domaines et emails…`,
			});

			for (const job of jobs) {
				const domain = normalizeDomain(job.companyWebsiteUrl);
				if (domain === WTTJ_DOMAIN) {
					skipped += 1;
					onEvent({
						type: "skip",
						reason: "URL WTTJ (pas de site externe)",
						company: job.companyName,
					});
					continue;
				}

				const existing = await this.leadRepository.findByDomain(domain);
				if (!existing.ok) {
					onEvent({ type: "error", message: existing.error.message });
					continue;
				}
				if (existing.value !== null) {
					skipped += 1;
					onEvent({
						type: "skip",
						reason: "Déjà en base",
						company: job.companyName,
					});
					continue;
				}

				const { emails } = await findEmailsForDomain(domain);
				const email = emails.length > 0 ? emails[0] : null;

				const createResult = await this.createLeadUsecase.execute({
					company: job.companyName,
					domain,
					email,
					source: job.source,
					status: LeadStatus.NEW,
				});

				if (!createResult.ok) {
					onEvent({ type: "error", message: createResult.error.message });
					continue;
				}

				created += 1;
				onEvent({ type: "lead_created", lead: createResult.value });
			}

			onEvent({ type: "done", created, skipped });
		} catch (err) {
			onEvent({
				type: "error",
				message: err instanceof Error ? err.message : String(err),
			});
			onEvent({ type: "done", created, skipped });
		}
	}
}
