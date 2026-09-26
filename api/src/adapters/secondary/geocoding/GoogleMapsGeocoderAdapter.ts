import { Result } from "typescript-result";
import type {
	GeocodeResult,
	GeocoderPort,
} from "@/application/command/ports/geocoder.port.ts";

interface GoogleGeocodeResponse {
	status?: string;
	error_message?: string;
	results?: {
		geometry?: { location?: { lat?: number; lng?: number } };
	}[];
}

export class GoogleMapsGeocoderAdapter implements GeocoderPort {
	private readonly apiKey: string | undefined;

	constructor(apiKey: string | undefined = process.env.GOOGLE_MAPS_API_KEY) {
		this.apiKey = apiKey;
	}

	async geocode(
		query: string,
		country = "FR",
	): Promise<Result<GeocodeResult, Error>> {
		if (!this.apiKey) {
			return Result.error(new Error("GEOCODER_NOT_CONFIGURED"));
		}

		const params = new URLSearchParams({
			address: query,
			key: this.apiKey,
			components: `country:${country}`,
		});
		const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;

		try {
			const res = await fetch(url);
			if (!res.ok) {
				return Result.error(new Error("GEOCODER_UNAVAILABLE"));
			}

			const data = (await res.json()) as GoogleGeocodeResponse;

			if (data.status !== "OK" || !data.results || data.results.length === 0) {
				return Result.ok({ lat: null, lng: null });
			}

			const loc = data.results[0]?.geometry?.location;
			if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") {
				return Result.ok({ lat: null, lng: null });
			}

			return Result.ok({ lat: loc.lat, lng: loc.lng });
		} catch {
			return Result.error(new Error("GEOCODER_UNAVAILABLE"));
		}
	}
}
