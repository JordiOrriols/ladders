import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildShareLink, copyToClipboard, importJsonFromFile } from "../sharing";

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
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: false,
      configurable: true,
    });
  });

  it("builds a hash-based share link", () => {
    const url = buildShareLink("SelfAssessment");
    expect(url).toBe("https://example.com/app/index.html#/SelfAssessment");
  });

  it("copies to clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    // @ts-expect-error mock clipboard
    navigator.clipboard = { writeText };
    await copyToClipboard("hello");
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("imports and validates JSON from file", async () => {
    const file = new File([JSON.stringify({ foo: "bar" })], "data.json", {
      type: "application/json",
    });
    const validator = (value: unknown): value is { foo: string } =>
      !!value && typeof (value as { foo?: unknown }).foo === "string";
    const data = await importJsonFromFile(file, validator);
    expect(data.foo).toBe("bar");
  });

  it("throws on invalid JSON shape", async () => {
    const file = new File([JSON.stringify({ foo: 123 })], "data.json", {
      type: "application/json",
    });
    const validator = (value: unknown): value is { foo: string } =>
      !!value && typeof (value as { foo?: unknown }).foo === "string";
    await expect(importJsonFromFile(file, validator)).rejects.toThrow("Invalid JSON shape");
  });
});
