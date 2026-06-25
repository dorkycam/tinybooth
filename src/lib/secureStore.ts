/**
 * Thin wrapper around `expo-secure-store` so the auth + event connection
 * modules can be tested without the native module being installed.
 *
 * The module is lazy-imported via a string variable so TypeScript does not
 * insist on the package being present at typecheck time. When `expo-secure-store`
 * is installed (production builds), the real implementation runs. In Vitest /
 * dev where it isn't, we fall back to an in-memory map.
 */

interface SecureStoreModule {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

let cached: SecureStoreModule | undefined;
const memory = new Map<string, string>();

const memoryFallback: SecureStoreModule = {
  async getItemAsync(key: string): Promise<string | null> {
    return memory.get(key) ?? null;
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    memory.set(key, value);
  },
  async deleteItemAsync(key: string): Promise<void> {
    memory.delete(key);
  },
};

/** Resolve the module, lazy-loading once. Falls back to in-memory in tests. */
async function getStore(): Promise<SecureStoreModule> {
  if (cached) return cached;
  try {
    cached = (await import('expo-secure-store')) as SecureStoreModule;
  } catch {
    cached = memoryFallback;
  }
  return cached;
}

/**
 * Read a value by key. Returns null when missing.
 *
 * @param key Storage key.
 */
export async function readSecure(key: string): Promise<string | null> {
  const s = await getStore();
  return s.getItemAsync(key);
}

/**
 * Persist a value under a key. Overwrites any existing value.
 *
 * @param key Storage key.
 * @param value Value to write.
 */
export async function writeSecure(key: string, value: string): Promise<void> {
  const s = await getStore();
  await s.setItemAsync(key, value);
}

/**
 * Remove a value by key. Idempotent.
 *
 * @param key Storage key.
 */
export async function deleteSecure(key: string): Promise<void> {
  const s = await getStore();
  await s.deleteItemAsync(key);
}

/** Test-only: clear the in-memory fallback. */
export function __resetSecureForTests(): void {
  memory.clear();
  cached = undefined;
}
