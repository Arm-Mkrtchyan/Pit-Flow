import type { Block, DrillAssignment, DrillModel, DrillUnit } from '../types/domain';
import { defaultDrilling, defaultModels, defaultRigs } from '../features/drilling/defaults';
import { fromLegacyBlocks } from '../features/drilling/drillSource';
import { matchModel } from '../features/drilling/rigList';

/**
 * Persisted-state migrations. Bump PERSIST_VERSION whenever the persisted shape changes and
 * add a step `from → from + 1`. Steps run in order from the stored version to the current one.
 */
export const PERSIST_VERSION = 11;

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
  // v7 → v8: installation duration added (default 60 min). Load time default is
  // now 5 min; a value still at the old default 15 becomes 5, a value set by the user is kept.
  7: (s) => {
    const d = s.drilling as Record<string, unknown>;
    const settings = d.settings as Record<string, unknown>;
    const load = settings.loadMinutesPerHole === 15 ? 5 : settings.loadMinutesPerHole;
    return {
      ...s,
      drilling: { ...d, settings: { ...settings, loadMinutesPerHole: load, installMinutes: 60 } },
    };
  },
  // v8 → v9: the approved equipment list is the default. An empty list gets it; a list the user
  // uploaded is kept.
  8: (s) => {
    const d = s.drilling as Record<string, unknown>;
    const rigs = Array.isArray(d.rigs) && d.rigs.length > 0 ? d.rigs : defaultModels();
    return { ...s, drilling: { ...d, rigs } };
  },
  // v9 → v10: productivity per model and the working rig list are separate. The old list was
  // productivity data, so it becomes the models; the rigs are the default working list. Table
  // rows that pointed at a model are cleared (their rig is now chosen from the working list).
  9: (s) => {
    const d = s.drilling as Record<string, unknown>;
    // Persisted v9 rigs were validated with the model shape when they were stored.
    const models = Array.isArray(d.rigs) ? (d.rigs as DrillModel[]) : defaultModels();
    const rigs = defaultRigs(models);
    const ids = new Set(rigs.map((r) => r.id));
    const assignments = Object.fromEntries(
      Object.entries((d.assignments ?? {}) as Record<string, DrillAssignment[]>).map(
        ([k, rows]) => [
          k,
          rows.map((r) => (r.rigId !== null && !ids.has(r.rigId) ? { ...r, rigId: null } : r)),
        ],
      ),
    );
    return { ...s, drilling: { ...d, models, rigs, assignments } };
  },
  // v10 → v11: D65 uses the DM-60/L8 productivity. Rigs without a model are matched again by
  // name; a model the user chose is kept.
  10: (s) => {
    const d = s.drilling as Record<string, unknown>;
    // Persisted v10 models and rigs were validated when they were stored.
    const models = (d.models ?? []) as DrillModel[];
    const rigs = ((d.rigs ?? []) as DrillUnit[]).map((r) =>
      r.modelId === null ? { ...r, modelId: matchModel(r.name, models) } : r,
    );
    return { ...s, drilling: { ...d, rigs } };
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
