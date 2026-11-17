import type { DrillModel, DrillRig, DrillUnit } from '../../types/domain';
import type { Grid } from '../import';

/*
 * Working rig list: one rig per row, its name in the first column ("Название"), e.g.
 * "СБШ - 2", "DM 45 - 1", "D60 - 1". An optional "Модель" column names the productivity model;
 * otherwise the model is matched from the name (see matchModel).
 */

const NAME_HEADER = /назв|наимен|станок|name|rig|անվան|սարք/;
const MODEL_HEADER = /модел|model|մոդել/;

const clean = (v: unknown) =>
  v === null || v === undefined ? '' : String(v).replace(/\s+/g, ' ').trim();
export const rigIdOf = (name: string) => clean(name).toLowerCase();

/** Letter + number groups of a name: "Atlas Copco DM-60/ L8" → dm:[60], l:[8]. */
function groups(text: string): Array<{ letters: string; numbers: number[] }> {
  const out: Array<{ letters: string; numbers: number[] }> = [];
  for (const m of text.toLowerCase().matchAll(/([a-zа-яё]+)|(\d+)/g)) {
    const [, letters, digits] = m;
    if (letters) out.push({ letters, numbers: [] });
    else if (digits) out.at(-1)?.numbers.push(Number(digits));
  }
  return out;
}

/**
 * Rigs that drill like a model their name does not mention: rig name (without the unit number)
 * → model name. D65 has no productivity card of its own and uses the DM-60/L8 one.
 */
const MODEL_ALIASES: Array<[RegExp, RegExp]> = [[/^d ?65$/i, /dm-?60/i]];

/**
 * Model of a rig, from its name without the trailing unit number ("DM 50 - 2" → "DM 50"): an
 * alias if one applies, else a model matches if one of its letter groups starts with the rig's
 * letters and, when the rig names a number, lists that number ("DM 50" → DM-45-50,
 * "D60" → DM-60/L8, "СБШ" → СБШ-250).
 */
export function matchModel(name: string, models: readonly DrillModel[]): string | null {
  const base = clean(name).replace(/\s*-\s*\d+\s*$/, '');
  const alias = MODEL_ALIASES.find(([rigRe]) => rigRe.test(base));
  if (alias) {
    const aliased = models.find((m) => alias[1].test(m.name));
    if (aliased) return aliased.id;
  }
  const [rig] = groups(base);
  if (!rig) return null;
  const number = rig.numbers[0];
  const hit = models.find((m) =>
    groups(m.name).some(
      (g) =>
        g.letters.startsWith(rig.letters) && (number === undefined || g.numbers.includes(number)),
    ),
  );
  return hit?.id ?? null;
}

export interface ParsedRigList {
  rigs: DrillUnit[];
  /** Rows without a name (1-based file rows). */
  skipped: number[];
}

/** Read the rig list; the header row is the first non-empty row. */
export function parseRigList(grid: Grid, models: readonly DrillModel[]): ParsedRigList {
  const headerIdx = grid.findIndex((row) => row.some((c) => clean(c) !== ''));
  const header = (grid[headerIdx] ?? []).map((c) => clean(c).toLowerCase());
  const nameCol = Math.max(
    header.findIndex((h) => NAME_HEADER.test(h)),
    0,
  );
  const modelCol = header.findIndex((h) => MODEL_HEADER.test(h));
  const modelByName = new Map(models.map((m) => [m.name.toLowerCase(), m.id]));

  const byId = new Map<string, DrillUnit>();
  const skipped: number[] = [];
  grid.slice(headerIdx + 1).forEach((row, i) => {
    if (!row.some((c) => clean(c) !== '')) return;
    const name = clean(row[nameCol]);
    if (!name) {
      skipped.push(headerIdx + 2 + i);
      return;
    }
    const modelName = modelCol >= 0 ? clean(row[modelCol]).toLowerCase() : '';
    const modelId = modelByName.get(modelName) ?? matchModel(name, models);
    byId.set(rigIdOf(name), { id: rigIdOf(name), name, modelId });
  });
  return { rigs: [...byId.values()], skipped };
}

/** Working rigs with their model's productivity, for the calculation and the table. */
export function resolveRigs(
  units: readonly DrillUnit[],
  models: readonly DrillModel[],
): DrillRig[] {
  const byId = new Map(models.map((m) => [m.id, m]));
  return units.map((u) => {
    const m = u.modelId !== null ? byId.get(u.modelId) : undefined;
    return m
      ? {
          id: u.id,
          name: u.name,
          model: m.name,
          hoursPerDay: m.hoursPerDay,
          byPosition: m.byPosition,
        }
      : { id: u.id, name: u.name, byPosition: {} };
  });
}
