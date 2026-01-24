import { describe, it, expect, beforeEach, vi } from "vitest";
import { clearStorageKey, loadFromStorage, saveToStorageDebounced } from "../storage";

const key = "test-storage-key";
const validator = (value: unknown): value is { foo: string } =>
  !!value && typeof (value as { foo?: unknown }).foo === "string";

describe("storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it("loads versioned payload when valid", () => {
    localStorage.setItem(key, JSON.stringify({ version: 1, data: { foo: "bar" } }));
    const result = loadFromStorage(key, validator, 1);
    expect(result).toEqual({ foo: "bar" });
  });

  it("returns null for invalid payload", () => {
    localStorage.setItem(key, JSON.stringify({ version: 1, data: { foo: 42 } }));
    const result = loadFromStorage(key, validator, 1);
    expect(result).toBeNull();
  });

  it("debounces saves to localStorage", () => {
    saveToStorageDebounced(key, { foo: "bar" }, 1, 100);
    expect(localStorage.getItem(key)).toBeNull();
    vi.advanceTimersByTime(100);
    const stored = localStorage.getItem(key);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string).data.foo).toBe("bar");
  });

  it("clears pending saves when clearing key", () => {
    saveToStorageDebounced(key, { foo: "bar" }, 1, 1000);
    clearStorageKey(key);
    vi.advanceTimersByTime(1000);
    expect(localStorage.getItem(key)).toBeNull();
  });
});
