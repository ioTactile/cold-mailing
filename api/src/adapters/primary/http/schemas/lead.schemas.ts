import { z } from "zod";

const leadStatusSchema = z.enum([
	"NEW",
	"CONTACTED",
	"REPLIED",
	"INTERESTED",
	"CLOSED",
]);

export const listLeadsQuerySchema = z.object({
	status: leadStatusSchema.optional(),
	source: z.string().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	offset: z.coerce.number().int().min(0).optional(),
});

export const createLeadBodySchema = z.object({
	company: z.string().min(1, "La compagnie est requise").trim(),
	domain: z.string().min(1, "Le domaine est requise").trim(),
	email: z.email().optional().nullable(),
	linkedin: z.string().optional().nullable(),
	techStack: z.string().optional().nullable(),
	source: z.string().min(1, "La source est requise").trim(),
	status: leadStatusSchema.optional(),
});

export const updateLeadStatusBodySchema = z.object({
	status: leadStatusSchema,
});

export const discoverLeadsBodySchema = z.object({
	source: z.enum(["WTTJ"]),
	query: z.string().optional(),
	limit: z.number().int().min(1).max(50).optional(),
});

export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
export type DiscoverLeadsBody = z.infer<typeof discoverLeadsBodySchema>;
export type CreateLeadBody = z.infer<typeof createLeadBodySchema>;
export type UpdateLeadStatusBody = z.infer<typeof updateLeadStatusBodySchema>;
