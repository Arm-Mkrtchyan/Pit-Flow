import { del, get, set } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/** zustand StateStorage backed by IndexedDB (data can exceed localStorage limits). */
export const idbStorage: StateStorage = {
  getItem: async (name) => (await get<string>(name)) ?? null,
  setItem: (name, value) => set(name, value),
  removeItem: (name) => del(name),
};

/** Keep an unreadable persisted blob so user data is never silently lost. */
export async function backupRaw(name: string, value: unknown): Promise<string> {
  const key = `${name}-backup-${new Date().toISOString()}`;
  await set(key, value);
  return key;
}
