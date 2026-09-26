import type { Result } from "typescript-result";

export interface GeocodeResult {
	lat: number | null;
	lng: number | null;
}

/**
 * Port pour le géocodage d'une adresse / localité.
 */
export interface GeocoderPort {
	geocode(
		query: string,
		country?: string,
	): Promise<Result<GeocodeResult, Error>>;
}
