/**
 * Persisted-state migrations. Bump PERSIST_VERSION whenever the persisted shape changes and
 * add a step `from → from + 1`. Steps run in order from the stored version to the current one.
 */
export const PERSIST_VERSION = 1;

type Step = (state: Record<string, unknown>) => Record<string, unknown>;

const STEPS: Record<number, Step> = {
  // Example for the next change:
  // 1: (s) => ({ ...s, settings: { ...(s.settings as object), newField: 0 } }),
};

export function migrate(persisted: unknown, fromVersion: number): unknown {
  if (typeof persisted !== 'object' || persisted === null) return persisted;
  let state = persisted as Record<string, unknown>;
  for (let v = fromVersion; v < PERSIST_VERSION; v++) {
    const step = STEPS[v];
    if (!step) throw new Error(`No migration from persisted version ${v} to ${v + 1}`);
    state = step(state);
  }
  return state;
}
