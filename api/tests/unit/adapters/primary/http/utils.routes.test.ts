import Fastify from 'fastify';
import { Result } from 'typescript-result';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppContainer } from '@/adapters/primary/http/container.ts';
import { registerUtilsRoutes } from '@/adapters/primary/http/routes/utils.routes.ts';
import { GeocodeAddressUsecase } from '@/application/query/usecases/geocode-address.usecase.ts';

describe('utils.routes - /utils/geocode', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retourne lat/lng pour une requête valide', async () => {
    const server = Fastify();
    const container = {
      geocodeAddressUsecase: {
        execute: vi.fn().mockResolvedValue(Result.ok({ lat: 48.11198, lng: -1.67429 })),
      },
    } as unknown as AppContainer;

    await registerUtilsRoutes(server, container);

    const response = await server.inject({
      method: 'POST',
      url: '/utils/geocode',
      payload: { query: 'Rennes' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      lat: 48.11198,
      lng: -1.67429,
    });
    expect(container.geocodeAddressUsecase.execute).toHaveBeenCalledWith('Rennes', undefined);
  });

  it('retourne 400 si la requête est vide', async () => {
    const server = Fastify();
    const container = {
      geocodeAddressUsecase: new GeocodeAddressUsecase({
        geocode: vi.fn(),
      }),
    } as unknown as AppContainer;

    await registerUtilsRoutes(server, container);

    const response = await server.inject({
      method: 'POST',
      url: '/utils/geocode',
      payload: { query: '' },
    });

    expect(response.statusCode).toBe(400);
  });
});
