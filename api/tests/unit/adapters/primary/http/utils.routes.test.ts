import Fastify from "fastify";
import { describe, expect, it, vi } from "vitest";

import { registerUtilsRoutes } from "@/adapters/primary/http/routes/utils.routes.ts";

describe("utils.routes - /utils/geocode", () => {
	it("retourne lat/lng pour une requête valide", async () => {
		const server = Fastify();

		const originalFetch = global.fetch;

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				status: "OK",
				results: [
					{
						geometry: {
							location: { lat: 48.11198, lng: -1.67429 },
						},
					},
				],
			}),
		});

		process.env.GOOGLE_MAPS_API_KEY = "test-key";

		await registerUtilsRoutes(server);

		const response = await server.inject({
			method: "POST",
			url: "/utils/geocode",
			payload: { query: "Rennes" },
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({
			lat: 48.11198,
			lng: -1.67429,
		});

		global.fetch = originalFetch;
	});
});
