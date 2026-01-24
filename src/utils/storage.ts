type Validator<T> = (value: unknown) => value is T;

interface VersionedPayload<T> {
  version: number;
  data: T;
}

const debounceTimers = new Map<string, number>();
const DEFAULT_VERSION = 1;
const DEFAULT_DELAY = 150;

function isVersionedPayload<T>(value: unknown): value is VersionedPayload<T> {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<VersionedPayload<T>>;
  return typeof payload.version === "number" && "data" in payload;
}

export function loadFromStorage<T>(
  key: string,
  validate: Validator<T>,
  currentVersion = DEFAULT_VERSION,
  migrate?: (data: unknown, version: number) => T | null
): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (isVersionedPayload<T>(parsed)) {
      if (parsed.version !== currentVersion && migrate) {
        return migrate(parsed.data, parsed.version);
      }
      return validate(parsed.data) ? parsed.data : null;
    }

    // Support legacy payloads without version wrapper
    return validate(parsed) ? parsed : null;
  } catch (error) {
    console.error(`Failed to parse storage key ${key}`, error);
    return null;
  }
}

function saveToStorage<T>(key: string, data: T, version = DEFAULT_VERSION) {
  const payload: VersionedPayload<T> = { version, data };
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.error(`Failed to persist storage key ${key}`, error);
  }
}

export function saveToStorageDebounced<T>(
  key: string,
  data: T,
  version = DEFAULT_VERSION,
  delay = DEFAULT_DELAY
) {
  const existingTimer = debounceTimers.get(key);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
  }

  const timer = window.setTimeout(() => {
    saveToStorage(key, data, version);
    debounceTimers.delete(key);
  }, delay);

  debounceTimers.set(key, timer);
}

export function clearStorageKey(key: string) {
  const existingTimer = debounceTimers.get(key);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
    debounceTimers.delete(key);
  }
  localStorage.removeItem(key);
}
