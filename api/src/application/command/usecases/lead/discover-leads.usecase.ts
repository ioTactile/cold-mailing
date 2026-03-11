import { scrapeWttjJobs } from "@/adapters/secondary/scraper/WttjScraper.ts";
import type { CreateLeadUsecase } from "@/application/command/usecases/lead/create-lead.usecase.ts";
import type { LeadRepository } from "@/domain/lead/lead.repository.ts";
import type { LeadType } from "@/domain/lead/lead.type.ts";
import {
	LeadSource,
	type LeadSource as LeadSourceType,
	LeadStatus,
} from "@/domain/lead/lead.type.ts";
import { normalizeDomain } from "@/pkg/domain/normalize-domain.ts";
import { findEmailsForDomain } from "@/pkg/email-finder/find-emails.ts";
import { logger } from "@/pkg/logger/index.ts";

export interface DiscoverLeadsOptions {
	source: LeadSourceType;
	query: string;
	limit: number;
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
		onEvent: (event: DiscoverEvent) => Promise<void>,
	): Promise<void> {
		const { source, query, limit } = options;

		logger.info(
			{ source, query, limit },
			"[DiscoverLeads] Démarrage de la découverte de leads.",
		);

		let created = 0;
		let skipped = 0;

		const emit = async (event: DiscoverEvent) => {
			const result = onEvent(event);
			if (result instanceof Promise) await result;
		};

		try {
			await emit({
				type: "step",
				message: `Scraping ${source} (requête : ${query})…`,
			});

			const jobs =
				source === LeadSource.WTTJ ? await scrapeWttjJobs(query, limit) : [];

			logger.info(
				{ source, query, limit, jobsCount: jobs.length },
				"[DiscoverLeads] Résultats reçus du scraper WTTJ.",
			);

			await emit({
				type: "step",
				message: `${jobs.length} entreprise(s) trouvée(s). Extraction des domaines et emails…`,
			});

			for (const job of jobs) {
				const domain = normalizeDomain(job.companyWebsiteUrl);

				logger.info(
					{
						company: job.companyName,
						rawUrl: job.companyWebsiteUrl,
						normalizedDomain: domain,
					},
					"[DiscoverLeads] Traitement d'une entreprise issue du scraper.",
				);

				if (domain === WTTJ_DOMAIN) {
					skipped += 1;
					await emit({
						type: "skip",
						reason: "URL WTTJ (pas de site externe)",
						company: job.companyName,
					});

					logger.info(
						{
							company: job.companyName,
							domain,
						},
						"[DiscoverLeads] Entreprise ignorée car domaine WTTJ.",
					);
					continue;
				}

				const existing = await this.leadRepository.findByDomain(domain);
				if (!existing.ok) {
					logger.error(
						{ domain, err: existing.error },
						"[DiscoverLeads] Erreur lors de la recherche d'un lead existant.",
					);
					await emit({ type: "error", message: existing.error.message });
					continue;
				}
				if (existing.value !== null) {
					skipped += 1;
					await emit({
						type: "skip",
						reason: "Déjà en base",
						company: job.companyName,
					});

					logger.info(
						{
							company: job.companyName,
							domain,
						},
						"[DiscoverLeads] Entreprise ignorée car déjà en base.",
					);
					continue;
				}

				const { emails } = await findEmailsForDomain(domain);
				const email = emails.length > 0 ? emails[0] : null;

				logger.info(
					{
						company: job.companyName,
						domain,
						email,
						emailsCount: emails.length,
					},
					"[DiscoverLeads] Emails trouvés pour le domaine.",
				);

				const createResult = await this.createLeadUsecase.execute({
					company: job.companyName,
					domain,
					email,
					source: job.source,
					status: LeadStatus.NEW,
				});

				if (!createResult.ok) {
					logger.error(
						{
							company: job.companyName,
							domain,
							err: createResult.error,
						},
						"[DiscoverLeads] Erreur lors de la création du lead.",
					);
					await emit({ type: "error", message: createResult.error.message });
					continue;
				}

				created += 1;

				logger.info(
					{
						company: job.companyName,
						domain,
						email,
					},
					"[DiscoverLeads] Lead créé avec succès.",
				);

				await emit({ type: "lead_created", lead: createResult.value });
			}

			logger.info(
				{ created, skipped, source, query, limit },
				"[DiscoverLeads] Découverte de leads terminée.",
			);

			await emit({ type: "done", created, skipped });
		} catch (err) {
			logger.error(
				{ err, source, query, limit, created, skipped },
				"[DiscoverLeads] Erreur globale lors de la découverte de leads.",
			);

			await emit({
				type: "error",
				message: err instanceof Error ? err.message : String(err),
			});
			await emit({ type: "done", created, skipped });
		}
	}
}
