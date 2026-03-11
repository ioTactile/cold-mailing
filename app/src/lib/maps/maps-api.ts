import { defaultFetchOptions, getApiUrl } from "@/lib/api/api-client";
import type { GoogleGeocodeLocation } from "@/types/google-maps";

export interface GeocodeOptions {
  country?: string;
  signal?: AbortSignal;
}

/**
 * Appelle l'API backend /utils/geocode pour géocoder une localisation.
 * Retourne { lat, lng } ou null si aucune coordonnée trouvée.
 * Lance une Error si l'appel backend échoue (status HTTP non 2xx).
 */
export async function geocodeLocation(
  query: string,
  options?: GeocodeOptions,
): Promise<GoogleGeocodeLocation | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const res = await fetch(`${getApiUrl()}/utils/geocode`, {
    ...defaultFetchOptions,
    method: "POST",
    signal: options?.signal,
    body: JSON.stringify({
      query: trimmed,
      country: options?.country ?? "FR",
    }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(
      data.error ?? "Erreur lors de l'appel au service de géocodage côté API.",
    );
  }

  const data = (await res.json()) as {
    lat: number | null;
    lng: number | null;
  };

  if (
    data.lat === null ||
    data.lng === null ||
    typeof data.lat !== "number" ||
    typeof data.lng !== "number"
  ) {
    return null;
  }

  return { lat: data.lat, lng: data.lng };
}

