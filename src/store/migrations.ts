/**
 * Persisted-state migrations. Bump PERSIST_VERSION whenever the persisted shape changes and
 * add a step `from → from + 1`. Steps run in order from the stored version to the current one.
 */
export const PERSIST_VERSION = 4;

type Step = (state: Record<string, unknown>) => Record<string, unknown>;

const STEPS: Record<number, Step> = {
  // v1 → v2: settings.aimExactTarget added (default off = aim anywhere inside the band).
  1: (s) => ({ ...s, settings: { ...(s.settings as object), aimExactTarget: false } }),
  // v2 → v3: UI language added. Existing users keep English, which they were using.
  2: (s) => ({ ...s, language: 'en' }),
  // v3 → v4: optional fields only (block site/siteKey, recalculated grades and actuals on
  // user inputs, history kind/beforeInputs). Existing data is valid as is.
  3: (s) => s,
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
