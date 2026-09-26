/**
 * Normalize a URL or host to a canonical domain (e.g. startup.com).
 * Used to dedupe leads and simplify email discovery.
 */
export function normalizeDomain(input: string): string {
  let url: URL;
  try {
    const trimmed = input.trim();
    const withProtocol = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    url = new URL(withProtocol);
  } catch {
    return input.trim().toLowerCase();
  }
  const hostname = url.hostname.toLowerCase();
  if (hostname.startsWith('www.')) {
    return hostname.slice(4);
  }
  return hostname;
}
