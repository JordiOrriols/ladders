import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildShareLink, buildVacationLink, copyToClipboard } from "../sharing";

describe("sharing helpers", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "location", {
      value: new URL("https://example.com/app/index.html#/old"),
      writable: false,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: false,
      configurable: true,
    });
  });

  it("preserves the configured Planner deployment pathname", () => {
    vi.stubEnv("VITE_PLANNER_URL", "https://planner.example.com/tools/planner/");
    expect(buildVacationLink("vacation-uuid")).toBe(
      "https://planner.example.com/tools/planner/#/vacations/vacation-uuid"
    );
  });

  it.each(["localhost", "127.0.0.1"])("uses the local fallback only on %s", (host) => {
    vi.stubEnv("VITE_PLANNER_URL", "");
    Object.defineProperty(window, "location", {
      value: new URL(`http://${host}:5173/ladders/`),
      configurable: true,
    });
    expect(buildVacationLink("vacation-uuid")).toBe(
      "http://127.0.0.1:5176/#/vacations/vacation-uuid"
    );
  });

  it.each(["example.com", "localhost.example.com", "192.168.1.5"])(
    "requires production configuration on %s",
    (host) => {
      vi.stubEnv("VITE_PLANNER_URL", "");
      Object.defineProperty(window, "location", {
        value: new URL(`https://${host}/ladders/`),
        configurable: true,
      });
      expect(() => buildVacationLink("vacation-uuid")).toThrow(/VITE_PLANNER_URL.*rebuild/);
    }
  );

  it.each(["/planner/", "javascript:alert(1)", "https://user:secret@example.com/"])(
    "rejects invalid Planner configuration %s",
    (configured) => {
      vi.stubEnv("VITE_PLANNER_URL", configured);
      expect(() => buildVacationLink("vacation-uuid")).toThrow(/VITE_PLANNER_URL/);
    }
  );

  it("replaces old query and hash routes without losing the pathname", () => {
    vi.stubEnv("VITE_PLANNER_URL", "https://example.com/planner/index.html?q=old#/old");
    expect(buildVacationLink("vacation-uuid")).toBe(
      "https://example.com/planner/index.html#/vacations/vacation-uuid"
    );
  });

  it("builds a hash-based share link", () => {
    const url = buildShareLink("e/11111111-1111-4111-8111-111111111111");
    expect(url).toBe("https://example.com/app/index.html#/e/11111111-1111-4111-8111-111111111111");
  });

  it("copies to clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    // @ts-expect-error mock clipboard
    navigator.clipboard = { writeText };
    await copyToClipboard("hello");
    expect(writeText).toHaveBeenCalledWith("hello");
  });
});
