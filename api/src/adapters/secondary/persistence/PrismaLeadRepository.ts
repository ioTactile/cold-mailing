import { Result } from "typescript-result";
import type {
	LeadRepository,
	ListLeadsFilters,
} from "@/domain/lead/lead.repository.ts";
import type { LeadType } from "@/domain/lead/lead.type.ts";
import { prisma } from "@/pkg/database/prisma.ts";

type LeadRow = {
	id: string;
	company: string;
	domain: string;
	email: string | null;
	linkedin: string | null;
	techStack: string | null;
	source: string;
	status: LeadType["status"];
	createdAt: Date;
} & { contactedAt?: Date | null };

function toDomain(row: LeadRow): LeadType {
	return {
		id: row.id,
		company: row.company,
		domain: row.domain,
		email: row.email,
		linkedin: row.linkedin,
		techStack: row.techStack,
		source: row.source,
		status: row.status,
		createdAt: row.createdAt,
		contactedAt: row.contactedAt ?? null,
	};
}

function startOfTodayUTC(): Date {
	const d = new Date();
	d.setUTCHours(0, 0, 0, 0);
	return d;
}

export class PrismaLeadRepository implements LeadRepository {
	async findAll(
		filters?: ListLeadsFilters,
	): Promise<Result<LeadType[], Error>> {
		try {
			const where: { status?: LeadType["status"]; source?: string } = {};
			if (filters?.status) {
				where.status = filters.status;
			}
			if (filters?.source) {
				where.source = filters.source;
			}
			const rows = await prisma.lead.findMany({
				where,
				take: filters?.limit ?? 50,
				skip: filters?.offset ?? 0,
				orderBy: { createdAt: "desc" },
			});
			return Result.ok(rows.map(toDomain));
		} catch (error) {
			return Result.error(error as Error);
		}
	}

	async findById(id: string): Promise<Result<LeadType | null, Error>> {
		try {
			const row = await prisma.lead.findUnique({ where: { id } });
			return Result.ok(row ? toDomain(row) : null);
		} catch (error) {
			return Result.error(error as Error);
		}
	}

	async findByDomain(domain: string): Promise<Result<LeadType | null, Error>> {
		try {
			const row = await prisma.lead.findFirst({ where: { domain } });
			return Result.ok(row ? toDomain(row) : null);
		} catch (error) {
			return Result.error(error as Error);
		}
	}

	async create(
		lead: Omit<LeadType, "id" | "createdAt" | "contactedAt">,
	): Promise<Result<LeadType, Error>> {
		try {
			const created = await prisma.lead.create({
				data: {
					company: lead.company,
					domain: lead.domain,
					email: lead.email ?? undefined,
					linkedin: lead.linkedin ?? undefined,
					techStack: lead.techStack ?? undefined,
					source: lead.source,
					status: lead.status,
				},
			});
			return Result.ok(toDomain(created));
		} catch (error) {
			return Result.error(error as Error);
		}
	}

	async update(lead: LeadType): Promise<Result<LeadType, Error>> {
		try {
			const updated = await prisma.lead.update({
				where: { id: lead.id },
				data: {
					company: lead.company,
					domain: lead.domain,
					email: lead.email ?? undefined,
					linkedin: lead.linkedin ?? undefined,
					techStack: lead.techStack ?? undefined,
					source: lead.source,
					status: lead.status,
					contactedAt: lead.contactedAt ?? undefined,
				},
			});
			return Result.ok(toDomain(updated));
		} catch (error) {
			return Result.error(error as Error);
		}
	}

	async countContactedToday(): Promise<Result<number, Error>> {
		try {
			const start = startOfTodayUTC();
			const count = await prisma.lead.count({
				where: {
					status: "CONTACTED",
					contactedAt: { gte: start },
				},
			});
			return Result.ok(count);
		} catch (error) {
			return Result.error(error as Error);
		}
	}
}
