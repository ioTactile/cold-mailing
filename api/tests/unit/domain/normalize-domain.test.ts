import { describe, expect, it } from 'vitest';
import { normalizeDomain } from '@/domain/lead/normalize-domain.ts';

describe('normalizeDomain', () => {
  it('extrait le domaine depuis une URL complète', () => {
    expect(normalizeDomain('https://www.startup.com/about')).toBe('startup.com');
  });

  it('accepte un host sans protocole', () => {
    expect(normalizeDomain('acme.io')).toBe('acme.io');
  });

  it('retire le préfixe www', () => {
    expect(normalizeDomain('https://www.example.fr')).toBe('example.fr');
  });
});
