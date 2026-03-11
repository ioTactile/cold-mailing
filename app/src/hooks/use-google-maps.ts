import { useCallback, useState } from "react";

import { geocodeLocation } from "@/lib/maps/maps-api";
import type { GoogleGeocodeLocation } from "@/types/google-maps";

export function useGoogleMaps() {
  const [error, setError] = useState<Error | null>(null);

  const geocode = useCallback(
    async (
      query: string,
      options?: { country?: string; signal?: AbortSignal },
    ): Promise<GoogleGeocodeLocation | null> => {
      const trimmed = query.trim();
      if (!trimmed) return null;

      try {
        return await geocodeLocation(trimmed, options);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(
            err instanceof Error
              ? err
              : new Error("Erreur inconnue lors du géocodage."),
          );
        }
        return null;
      }
    },
    [],
  );

  return {
    error,
    geocode,
  };
}
