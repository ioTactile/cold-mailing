import { z } from "zod";

const leadStatusSchema = z.enum([
	"NEW",
	"CONTACTED",
	"REPLIED",
	"INTERESTED",
	"CLOSED",
]);

const leadSourceSchema = z.enum(["WTTJ", "INDEED"]);

const discoverLocationSchema = z
	.object({
		/**
		 * Libellé lisible de la localisation (ex: "Rennes (35)", "Rennes, Ille-et-Vilaine, Bretagne, France").
		 */
		label: z.string().min(1, "La localisation est requise").trim(),
		/**
		 * Rayon de recherche en kilomètres.
		 */
		radiusKm: z
			.number()
			.int()
			.min(1, "Le rayon doit être supérieur ou égal à 1 km")
			.max(500, "Le rayon ne peut pas dépasser 500 km")
			.optional(),
		/**
		 * Coordonnées optionnelles pour les sources qui les supportent (WTTJ).
		 */
		lat: z.number().optional(),
		lng: z.number().optional(),
	})
	.optional();

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
	source: leadSourceSchema,
	status: leadStatusSchema.optional(),
});

export const updateLeadStatusBodySchema = z.object({
	status: leadStatusSchema,
});

export const discoverLeadsBodySchema = z.object({
	sources: z.array(leadSourceSchema).min(1, "Au moins une source est requise"),
	query: z.string().min(1, "La requête est requise").trim(),
	limit: z.number().int().min(1).max(50),
	location: discoverLocationSchema,
});

export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
export type DiscoverLeadsBody = z.infer<typeof discoverLeadsBodySchema>;
export type CreateLeadBody = z.infer<typeof createLeadBodySchema>;
export type UpdateLeadStatusBody = z.infer<typeof updateLeadStatusBodySchema>;
