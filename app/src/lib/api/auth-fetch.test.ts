import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as authApi from "@/lib/auth/auth-api";
import { queryKeys } from "@/lib/query/query-keys";

import { executeWithAuthRetry } from "./auth-fetch";

vi.mock("@/lib/auth/auth-api");

describe("executeWithAuthRetry", () => {
  const createClient = (initialToken?: string) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    if (initialToken) {
      client.setQueryData(queryKeys.auth.session(), initialToken);
    }
    return client;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("utilise le token du cache et retourne les données", async () => {
    const client = createClient("token-123");

    const fn = vi
      .fn()
      .mockResolvedValue({ ok: true, data: { value: 42 } } as const);

    const result = await executeWithAuthRetry({
      queryClient: client,
      accessTokenFromHook: null,
      fn,
      args: [],
    });

    expect(fn).toHaveBeenCalledWith("token-123");
    expect(result).toEqual({ value: 42 });
  });

  it('fait un refresh et rejoue la requête en cas de "Non authentifié."', async () => {
    const client = createClient("token-123");

    const fn = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: "Non authentifié." } as const)
      .mockResolvedValueOnce({ ok: true, data: { value: 99 } } as const);

    vi.mocked(authApi.refresh).mockResolvedValue({
      ok: true,
      accessToken: "token-refreshed",
      expiresInSeconds: 900,
    });

    const result = await executeWithAuthRetry({
      queryClient: client,
      accessTokenFromHook: null,
      fn,
      args: [],
    });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, "token-123");
    expect(fn).toHaveBeenNthCalledWith(2, "token-refreshed");
    expect(authApi.refresh).toHaveBeenCalled();
    expect(result).toEqual({ value: 99 });
  });
});

