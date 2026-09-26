import type { FastifyInstance } from "fastify";
import type { AppContainer } from "@/adapters/primary/http/container.ts";

export async function registerUtilsRoutes(
	server: FastifyInstance,
	container: AppContainer,
) {
	const { geocodeAddressUsecase } = container;

	server.post<{
		Body: { query?: string; country?: string };
	}>("/utils/geocode", async (request, reply) => {
		const result = await geocodeAddressUsecase.execute(
			request.body?.query ?? "",
			request.body?.country,
		);

		if (!result.ok) {
			if (result.error.message === "EMPTY_GEOCODE_QUERY") {
				return reply
					.status(400)
					.send({ error: "La requête de géocodage est requise." });
			}
			if (result.error.message === "GEOCODER_NOT_CONFIGURED") {
				request.log.error(
					"[Geocode] Clé Google Maps manquante (GOOGLE_MAPS_API_KEY).",
				);
				return reply.status(500).send({
					error: "Configuration Google Maps manquante côté serveur.",
				});
			}
			if (result.error.message === "GEOCODER_UNAVAILABLE") {
				return reply.status(502).send({
					error:
						"Erreur lors de l'appel au service de géocodage. Réessayez plus tard.",
				});
			}
			request.log.error({ err: result.error }, "[Geocode] Erreur inattendue.");
			return reply.status(500).send({
				error:
					"Erreur lors de la récupération des coordonnées. Réessayez plus tard.",
			});
		}

		return reply.status(200).send(result.value);
	});
}
