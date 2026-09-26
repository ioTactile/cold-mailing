import type { Result } from 'typescript-result';

export interface GeocodeResult {
  lat: number | null;
  lng: number | null;
}

/**
 * Port for geocoding an address / locality.
 */
export interface GeocoderPort {
  geocode(query: string, country?: string): Promise<Result<GeocodeResult, Error>>;
}
