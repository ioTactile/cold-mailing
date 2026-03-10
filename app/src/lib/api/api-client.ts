/**
 * URL de base de l'API (côté client).
 * Utilise NEXT_PUBLIC_API_URL si défini, sinon http://localhost:3000 en dev.
 */
export function getApiUrl(): string {
  return String(process.env.NEXT_PUBLIC_API_URL);
}

export const defaultFetchOptions: RequestInit = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
};
