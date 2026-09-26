import { describe, expect, it } from 'vitest';
import {
  buildIndeedSearchUrl,
  extractCompanyFromIndeedLdJsonScripts,
} from '@/adapters/secondary/scraper/IndeedScraper.ts';

describe('IndeedScraper helpers', () => {
  it('buildIndeedSearchUrl construit une URL de recherche en France', () => {
    const url = buildIndeedSearchUrl('React');

    expect(url).toContain('https://fr.indeed.com/jobs');
    expect(url).toContain('q=React');
    expect(url).toContain('l=France');
  });

  it('buildIndeedSearchUrl permet de cibler une ville et un rayon', () => {
    const url = buildIndeedSearchUrl('react', {
      label: 'Rennes (35)',
      radiusKm: 100,
    });

    expect(url).toContain('https://fr.indeed.com/jobs');
    expect(url).toContain('q=react');
    expect(url).toContain('l=Rennes+%2835%29');
    expect(url).toContain('radius=100');
  });

  it('extractCompanyFromIndeedLdJsonScripts extrait nom et site depuis un JobPosting simple', () => {
    const scripts = [
      JSON.stringify({
        '@type': 'JobPosting',
        hiringOrganization: {
          name: 'Ma Startup',
          sameAs: 'https://ma-startup.fr',
        },
      }),
    ];

    const result = extractCompanyFromIndeedLdJsonScripts(scripts);

    expect(result).not.toBeNull();
    expect(result?.companyName).toBe('Ma Startup');
    expect(result?.companyWebsiteUrl).toBe('https://ma-startup.fr');
  });

  it('extractCompanyFromIndeedLdJsonScripts ignore les scripts sans JobPosting valable', () => {
    const scripts = [
      JSON.stringify({
        '@type': 'Organization',
        name: 'Autre chose',
      }),
    ];

    const result = extractCompanyFromIndeedLdJsonScripts(scripts);

    expect(result).toBeNull();
  });
});
