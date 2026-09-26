import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deleteLead, getLeadById, getLeads, updateLeadStatus } from "./leads-api";

vi.mock("@/lib/api/api-client", () => ({
  getApiUrl: vi.fn(() => "https://api.test"),
  defaultFetchOptions: {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  },
}));

describe("leads-api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getLeads retourne la liste en 200", async () => {
    const leads = [{ id: "1", company: "Acme" }];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(leads),
    });

    const result = await getLeads("token", { status: "NEW" });

    expect(result).toEqual({ ok: true, data: leads });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/leads?status=NEW",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("getLeadById mappe le 404", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Lead non trouvé." }),
    });

    const result = await getLeadById("token", "missing");
    expect(result).toEqual({ ok: false, error: "Lead non trouvé." });
  });

  it("updateLeadStatus envoie le PATCH", async () => {
    const lead = { id: "1", status: "CONTACTED" };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(lead),
    });

    const result = await updateLeadStatus("token", "1", "CONTACTED");
    expect(result).toEqual({ ok: true, data: lead });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.test/leads/1/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "CONTACTED" }),
      }),
    );
  });

  it("deleteLead accepte le 204", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve({}),
    });

    const result = await deleteLead("token", "1");
    expect(result).toEqual({ ok: true });
  });
});
