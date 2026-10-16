import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildShareLink, buildVacationLink, copyToClipboard } from "../sharing";

describe("sharing helpers", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "location", {
      value: new URL("https://example.com/app/index.html#/old"),
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      configurable: true,
    });
  });

  it.each(["localhost", "127.0.0.1", "example.com"])("uses the shared registry from %s", (host) => {
    Object.defineProperty(window, "location", {
      value: new URL(`https://${host}/ladders/`),
      configurable: true,
    });
    expect(buildVacationLink("vacation-uuid")).toBe(
      "https://planner.jordiorriols.cat/#/vacations/vacation-uuid"
    );
  });

  it("encodes tokens without introducing new routes or query parameters", () => {
    expect(buildVacationLink("token/?x=1")).toBe(
      "https://planner.jordiorriols.cat/#/vacations/token%2F%3Fx%3D1"
    );
  });

  it("builds a hash-based share link", () => {
    expect(buildShareLink("e/11111111-1111-4111-8111-111111111111")).toBe(
      "https://example.com/app/index.html#/e/11111111-1111-4111-8111-111111111111"
    );
  });

  it("copies to clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await copyToClipboard("hello");
    expect(writeText).toHaveBeenCalledWith("hello");
  });
});
