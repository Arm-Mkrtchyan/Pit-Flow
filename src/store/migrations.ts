import type { Block } from '../types/domain';
import { defaultDrilling } from '../features/drilling/defaults';
import { fromLegacyBlocks } from '../features/drilling/drillSource';

/**
 * Persisted-state migrations. Bump PERSIST_VERSION whenever the persisted shape changes and
 * add a step `from → from + 1`. Steps run in order from the stored version to the current one.
 */
export const PERSIST_VERSION = 7;

type Step = (state: Record<string, unknown>) => Record<string, unknown>;

const STEPS: Record<number, Step> = {
  // v1 → v2: settings.aimExactTarget added (default off = aim anywhere inside the band).
  1: (s) => ({ ...s, settings: { ...(s.settings as object), aimExactTarget: false } }),
  // v2 → v3: UI language added. Existing users keep English, which they were using.
  2: (s) => ({ ...s, language: 'en' }),
  // v3 → v4: optional fields only (block site/siteKey, recalculated grades and actuals on
  // user inputs, history kind/beforeInputs). Existing data is valid as is.
  3: (s) => s,
  // v4 → v5: drilling planning (rigs, rig rows per block, settings). Blocks may carry optional
  // mining dates; existing blocks are valid without them.
  4: (s) => ({ ...s, drilling: defaultDrilling() }),
  // v5 → v6: the drilling page gets its own block list. Start it as a copy of the current
  // (until now shared) blocks, so rig rows set up on the drilling page keep their blocks.
  5: (s) => ({
    ...s,
    drilling: { ...(s.drilling as object), blocks: Array.isArray(s.blocks) ? s.blocks : [] },
  }),
  // v6 → v7: the drilling list holds locations from the production schedule instead of block
  // rows. Group the old rows by location (same keys, so rig rows stay attached).
  6: (s) => {
    const d = s.drilling as Record<string, unknown>;
    // Persisted v6 drilling blocks were validated as Block rows when they were stored.
    const old = Array.isArray(d.blocks) ? (d.blocks as Block[]) : [];
    return { ...s, drilling: { ...d, blocks: fromLegacyBlocks(old) } };
  },
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
