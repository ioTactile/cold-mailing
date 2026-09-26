import { Result } from 'typescript-result';
import type { GeocodeResult, GeocoderPort } from '@/application/command/ports/geocoder.port.ts';

export class GeocodeAddressUsecase {
  private readonly geocoder: GeocoderPort;

  constructor(geocoder: GeocoderPort) {
    this.geocoder = geocoder;
  }

  async execute(query: string, country?: string): Promise<Result<GeocodeResult, Error>> {
    const trimmed = query.trim();
    if (!trimmed) {
      return Result.error(new Error('EMPTY_GEOCODE_QUERY'));
    }
    return this.geocoder.geocode(trimmed, country?.trim() || 'FR');
  }
}
