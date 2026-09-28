// Thin wrappers around localStorage/sessionStorage.
// Only use for non-sensitive client state (e.g. UI preferences).
// Tokens should be handled via httpOnly cookies or in-memory state,
// not localStorage, once auth is implemented for real.

export const localCache = {
  get<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: string): void {
    localStorage.removeItem(key);
  },
};
