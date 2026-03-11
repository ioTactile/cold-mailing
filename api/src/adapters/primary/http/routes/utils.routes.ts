import type { FastifyInstance } from "fastify";

interface GeocodeBody {
	query?: string;
	country?: string;
}

export async function registerUtilsRoutes(server: FastifyInstance) {
	server.post<{
		Body: GeocodeBody;
	}>("/utils/geocode", async (request, reply) => {
		const rawQuery = request.body?.query ?? "";
		const query = rawQuery.trim();

		if (!query) {
			return reply
				.status(400)
				.send({ error: "La requête de géocodage est requise." });
		}

		const apiKey = process.env.GOOGLE_MAPS_API_KEY;

		if (!apiKey) {
			request.log.error(
				"[Geocode] Clé Google Maps manquante (GOOGLE_MAPS_API_KEY).",
			);
			return reply
				.status(500)
				.send({ error: "Configuration Google Maps manquante côté serveur." });
		}

		const country = request.body.country?.trim() || "FR";

		const params = new URLSearchParams({
			address: query,
			key: apiKey,
			components: `country:${country}`,
		});

		const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;

		try {
			const res = await fetch(url);
			if (!res.ok) {
				request.log.error(
					{ status: res.status, statusText: res.statusText },
					"[Geocode] Appel Google Geocoding échoué.",
				);
				return reply.status(502).send({
					error:
						"Erreur lors de l'appel au service de géocodage. Réessayez plus tard.",
				});
			}

			const data = (await res.json()) as {
				status?: string;
				error_message?: string;
				results?: {
					geometry?: { location?: { lat?: number; lng?: number } };
				}[];
			};

			if (data.status !== "OK" || !data.results || data.results.length === 0) {
				request.log.warn(
					{ status: data.status, error_message: data.error_message },
					"[Geocode] Aucune coordonnée trouvée pour cette requête.",
				);

				return reply.status(200).send({ lat: null, lng: null });
			}

			const loc = data.results[0]?.geometry?.location;

			if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
				request.log.warn(
					{ location: loc },
					"[Geocode] Réponse sans coordonnées valides.",
				);
				return reply.status(200).send({ lat: null, lng: null });
			}

			return reply.status(200).send({ lat: loc.lat, lng: loc.lng });
		} catch (error) {
			request.log.error({ err: error }, "[Geocode] Erreur inattendue.");
			return reply.status(500).send({
				error:
					"Erreur lors de la récupération des coordonnées. Réessayez plus tard.",
			});
		}
	});
}
