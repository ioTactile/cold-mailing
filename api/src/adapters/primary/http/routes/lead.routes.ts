import type { FastifyInstance } from "fastify";
import type { AppContainer } from "@/adapters/primary/http/container.ts";
import {
	createLeadBodySchema,
	discoverLeadsBodySchema,
	listLeadsQuerySchema,
	updateLeadStatusBodySchema,
} from "@/adapters/primary/http/schemas/lead.schemas.ts";

export async function registerLeadRoutes(
	server: FastifyInstance,
	container: AppContainer,
) {
	const {
		listLeadsUsecase,
		getLeadByIdUsecase,
		createLeadUsecase,
		updateLeadStatusUsecase,
		deleteLeadUsecase,
		discoverLeadsUsecase,
		sendColdEmailToLeadUsecase,
		getLinkedInMessageForLeadUsecase,
	} = container;

	server.get<{ Querystring: unknown }>(
		"/leads",
		{ preHandler: [server.requireAuth] },
		async (request, reply) => {
			const parsed = listLeadsQuerySchema.safeParse(request.query);
			if (!parsed.success) {
				return reply.status(400).send({ error: parsed.error.flatten() });
			}
			const filters = {
				status: parsed.data.status,
				source: parsed.data.source,
				limit: parsed.data.limit,
				offset: parsed.data.offset,
			};
			const result = await listLeadsUsecase.execute(filters);
			if (!result.ok) {
				request.log.error(result.error);
				return reply.status(500).send({ error: "Erreur serveur." });
			}
			return reply.status(200).send(result.value);
		},
	);

	server.get<{ Params: { id: string } }>(
		"/leads/:id",
		{ preHandler: [server.requireAuth] },
		async (request, reply) => {
			const { id } = request.params;
			const result = await getLeadByIdUsecase.execute(id);
			if (!result.ok) {
				request.log.error(result.error);
				return reply.status(500).send({ error: "Erreur serveur." });
			}
			if (result.value === null) {
				return reply.status(404).send({ error: "Lead non trouvé." });
			}
			return reply.status(200).send(result.value);
		},
	);

	server.get<{ Params: { id: string } }>(
		"/leads/:id/linkedin-message",
		{ preHandler: [server.requireAuth] },
		async (request, reply) => {
			const result = await getLinkedInMessageForLeadUsecase.execute(
				request.params.id,
			);
			if (!result.ok) {
				if (result.error.message === "LEAD_NOT_FOUND") {
					return reply.status(404).send({ error: "Lead non trouvé." });
				}
				request.log.error(result.error);
				return reply.status(500).send({ error: "Erreur serveur." });
			}
			return reply.status(200).send(result.value);
		},
	);

	server.post<{ Body: unknown }>(
		"/leads",
		{ preHandler: [server.requireAuth] },
		async (request, reply) => {
			const parsed = createLeadBodySchema.safeParse(request.body);
			if (!parsed.success) {
				return reply.status(400).send({ error: parsed.error.flatten() });
			}
			const input = {
				...parsed.data,
				linkedin: parsed.data.linkedin || null,
			};
			const result = await createLeadUsecase.execute(input);
			if (!result.ok) {
				request.log.error(result.error);
				return reply.status(500).send({ error: "Erreur serveur." });
			}
			return reply.status(201).send(result.value);
		},
	);

	server.patch<{
		Params: { id: string };
		Body: unknown;
	}>(
		"/leads/:id/status",
		{ preHandler: [server.requireAuth] },
		async (request, reply) => {
			const parsed = updateLeadStatusBodySchema.safeParse(request.body);
			if (!parsed.success) {
				return reply.status(400).send({ error: parsed.error.flatten() });
			}
			const result = await updateLeadStatusUsecase.execute(
				request.params.id,
				parsed.data.status,
			);
			if (!result.ok) {
				if (result.error.message === "LEAD_NOT_FOUND") {
					return reply.status(404).send({ error: "Lead non trouvé." });
				}
				request.log.error(result.error);
				return reply.status(500).send({ error: "Erreur serveur." });
			}
			return reply.status(200).send(result.value);
		},
	);

	server.post<{ Params: { id: string } }>(
		"/leads/:id/send-email",
		{ preHandler: [server.requireAuth] },
		async (request, reply) => {
			const result = await sendColdEmailToLeadUsecase.execute(
				request.params.id,
			);
			if (!result.ok) {
				if (result.error.message === "LEAD_NOT_FOUND") {
					return reply.status(404).send({ error: "Lead non trouvé." });
				}
				if (result.error.message === "LEAD_NO_EMAIL") {
					return reply.status(400).send({
						error: "Ce lead n'a pas d'adresse email.",
					});
				}
				if (result.error.message === "LEAD_ALREADY_CONTACTED") {
					return reply.status(400).send({
						error: "Ce lead a déjà été contacté.",
					});
				}
				if (result.error.message === "DAILY_LIMIT_REACHED") {
					return reply.status(429).send({
						error: "Limite quotidienne d'envoi atteinte (50 emails/jour).",
					});
				}
				request.log.error(result.error);
				return reply.status(500).send({ error: "Erreur serveur." });
			}
			return reply.status(200).send(result.value);
		},
	);

	server.delete<{ Params: { id: string } }>(
		"/leads/:id",
		{ preHandler: [server.requireAuth] },
		async (request, reply) => {
			const result = await deleteLeadUsecase.execute(request.params.id);
			if (!result.ok) {
				if (result.error.message === "LEAD_NOT_FOUND") {
					return reply.status(404).send({ error: "Lead non trouvé." });
				}
				request.log.error(result.error);
				return reply.status(500).send({ error: "Erreur serveur." });
			}
			return reply.status(204).send();
		},
	);

	server.post<{ Body: unknown }>(
		"/leads/discover",
		{ preHandler: [server.requireAuth], sse: true },
		async (request, reply) => {
			const parsed = discoverLeadsBodySchema.safeParse(request.body);
			if (!parsed.success) {
				return reply.status(400).send({ error: parsed.error.flatten() });
			}
			reply.sse.keepAlive();
			for (const source of parsed.data.sources) {
				const options = {
					source,
					query: parsed.data.query,
					limit: parsed.data.limit,
					location: parsed.data.location,
				};
				await discoverLeadsUsecase.execute(options, async (event) => {
					await reply.sse.send({ data: event });
				});
			}
			reply.sse.close();
		},
	);
}
