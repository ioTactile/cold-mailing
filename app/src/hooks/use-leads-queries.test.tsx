import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as leadsApi from "@/lib/leads/leads-api";
import { queryKeys } from "@/lib/query/query-keys";
import type { Lead } from "@/types/lead";

import { useLeads } from "./use-leads-queries";

vi.mock("@/lib/leads/leads-api");

function createWrapper(initialSessionToken?: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  if (initialSessionToken) {
    queryClient.setQueryData(queryKeys.auth.session(), initialSessionToken);
  }

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("use-leads-queries", () => {
  const mockLeads: Lead[] = [
    {
      id: "lead-1",
      company: "Test",
      domain: "test.com",
      email: "contact@test.com",
      source: "WTTJ",
      status: "NEW",
      createdAt: "2025-01-01T00:00:00Z",
      contactedAt: null,
      linkedin: null,
      techStack: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useLeads", () => {
    it("charge les leads avec le token courant", async () => {
      vi.mocked(leadsApi.getLeads).mockResolvedValue({
        ok: true,
        data: mockLeads,
      });

      const { result } = renderHook(() => useLeads(), {
        wrapper: createWrapper("token-123"),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(leadsApi.getLeads).toHaveBeenCalledWith("token-123", undefined);
      expect(result.current.data).toEqual(mockLeads);
    });
  });
});
