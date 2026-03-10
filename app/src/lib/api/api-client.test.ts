import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultFetchOptions, getApiUrl } from "./api-client";

describe("api-client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getApiUrl", () => {
    it("retourne NEXT_PUBLIC_API_URL", () => {
      expect(getApiUrl()).toBe("https://api.example.com");
    });
  });

  describe("defaultFetchOptions", () => {
    it("inclut credentials include et Content-Type json", () => {
      expect(defaultFetchOptions.credentials).toBe("include");
      expect(defaultFetchOptions.headers).toEqual(
        expect.objectContaining({
          "Content-Type": "application/json",
        }),
      );
    });
  });
});
