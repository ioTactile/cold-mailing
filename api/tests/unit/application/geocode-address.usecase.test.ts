import { Result } from "typescript-result";
import { describe, expect, it, vi } from "vitest";
import type { GeocoderPort } from "@/application/command/ports/geocoder.port.ts";
import { GeocodeAddressUsecase } from "@/application/query/usecases/geocode-address.usecase.ts";

describe("GeocodeAddressUsecase", () => {
	it("retourne EMPTY_GEOCODE_QUERY si la requête est vide", async () => {
		const geocoder: GeocoderPort = { geocode: vi.fn() };
		const usecase = new GeocodeAddressUsecase(geocoder);

		const result = await usecase.execute("   ");
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.message).toBe("EMPTY_GEOCODE_QUERY");
		expect(geocoder.geocode).not.toHaveBeenCalled();
	});

	it("délègue au géocodeur", async () => {
		const geocoder: GeocoderPort = {
			geocode: vi.fn().mockResolvedValue(Result.ok({ lat: 48.1, lng: -1.6 })),
		};
		const usecase = new GeocodeAddressUsecase(geocoder);

		const result = await usecase.execute("Rennes", "FR");
		expect(result.ok).toBe(true);
		expect(geocoder.geocode).toHaveBeenCalledWith("Rennes", "FR");
	});
});
