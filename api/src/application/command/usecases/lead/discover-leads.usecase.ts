import type { EmailFinderPort } from "@/application/command/ports/email-finder.port.ts";
import type { JobBoardScraperPort } from "@/application/command/ports/job-board-scraper.port.ts";
import type { LoggerPort } from "@/application/command/ports/logger.port.ts";
import type { CreateLeadUsecase } from "@/application/command/usecases/lead/create-lead.usecase.ts";
import type { LeadRepository } from "@/domain/lead/lead.repository.ts";
import type { LeadType, LinkedinSearchUrls } from "@/domain/lead/lead.type.ts";
import {
	buildLinkedinSearchQueries,
	type LeadSource as LeadSourceType,
	LeadStatus,
} from "@/domain/lead/lead.type.ts";
import { normalizeDomain } from "@/domain/lead/normalize-domain.ts";

export interface DiscoverLocationOptions {
	label?: string;
	radiusKm?: number;
	lat?: number;
	lng?: number;
}

export interface DiscoverLeadsOptions {
	source: LeadSourceType;
	query: string;
	limit: number;
	location?: DiscoverLocationOptions;
}

type LeadWithLinkedinSearch = LeadType & LinkedinSearchUrls;

export type DiscoverEvent =
	| { type: "step"; message: string }
	| { type: "lead_created"; lead: LeadWithLinkedinSearch }
	| { type: "skip"; reason: string; company?: string }
	| { type: "done"; created: number; skipped: number }
	| { type: "error"; message: string };

const PLATFORM_DOMAINS = new Set(["welcometothejungle.com", "indeed.com"]);

export class DiscoverLeadsUsecase {
	private readonly leadRepository: LeadRepository;
	private readonly createLeadUsecase: CreateLeadUsecase;
	private readonly scrapers: Partial<
		Record<LeadSourceType, JobBoardScraperPort>
	>;
	private readonly emailFinder: EmailFinderPort;
	private readonly logger: LoggerPort;

	constructor(
		leadRepository: LeadRepository,
		createLeadUsecase: CreateLeadUsecase,
		scrapers: Partial<Record<LeadSourceType, JobBoardScraperPort>>,
		emailFinder: EmailFinderPort,
		logger: LoggerPort,
	) {
		this.leadRepository = leadRepository;
		this.createLeadUsecase = createLeadUsecase;
		this.scrapers = scrapers;
		this.emailFinder = emailFinder;
		this.logger = logger;
	}

	async execute(
		options: DiscoverLeadsOptions,
		onEvent: (event: DiscoverEvent) => Promise<void>,
	): Promise<void> {
		const { source, query, limit, location } = options;

		this.logger.info(
			{ source, query, limit, location },
			"[DiscoverLeads] Démarrage de la découverte de leads.",
		);

		let created = 0;
		let skipped = 0;

		const emit = async (event: DiscoverEvent) => {
			await onEvent(event);
		};

		try {
			await emit({
				type: "step",
				message: `Scraping ${source} (requête : ${query}${
					location?.label ? `, localisation : ${location.label}` : ""
				})…`,
			});

			const scraper = this.scrapers[source];
			if (!scraper) {
				await emit({
					type: "error",
					message: `Source de scraping non supportée : ${source}`,
				});
				await emit({ type: "done", created, skipped });
				return;
			}

			const jobs = await scraper.search(query, limit, location);

			this.logger.info(
				{ source, query, limit, location, jobsCount: jobs.length },
				"[DiscoverLeads] Résultats reçus du scraper.",
			);

			await emit({
				type: "step",
				message: `${jobs.length} entreprise(s) trouvée(s). Extraction des domaines et emails…`,
			});

			for (const job of jobs) {
				const domain = normalizeDomain(job.companyWebsiteUrl);

				this.logger.info(
					{
						company: job.companyName,
						rawUrl: job.companyWebsiteUrl,
						normalizedDomain: domain,
					},
					"[DiscoverLeads] Traitement d'une entreprise issue du scraper.",
				);

				if (PLATFORM_DOMAINS.has(domain)) {
					skipped += 1;
					await emit({
						type: "skip",
						reason: "URL de la plateforme d'offres (pas de site externe)",
						company: job.companyName,
					});
					continue;
				}

				const existing = await this.leadRepository.findByDomain(domain);
				if (!existing.ok) {
					this.logger.error(
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
					continue;
				}

				const { emails } = await this.emailFinder.findEmailsForDomain(domain);
				const email = emails.length > 0 ? emails[0] : null;

				const createResult = await this.createLeadUsecase.execute({
					company: job.companyName,
					domain,
					email,
					source: job.source,
					status: LeadStatus.NEW,
				});

				if (!createResult.ok) {
					this.logger.error(
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

				const leadWithUrls: LeadWithLinkedinSearch = {
					...createResult.value,
					...buildLinkedinSearchQueries(
						createResult.value.company,
						createResult.value.domain,
					),
				};

				await emit({ type: "lead_created", lead: leadWithUrls });
			}

			this.logger.info(
				{ created, skipped, source, query, limit },
				"[DiscoverLeads] Découverte de leads terminée.",
			);

			await emit({ type: "done", created, skipped });
		} catch (err) {
			this.logger.error(
				{ err, source, query, limit, location, created, skipped },
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
