import type { DrillModel } from '../../types/domain';
import type { Cell, Grid } from '../import';

/*
 * Approved equipment workbook ("производительность" sheet): one parameter card per rig model,
 * side by side. A card is three columns — label | unit | value — starting at the
 * "Модель бурового станка" row (the model name sits in the unit column). The number below the
 * card in its value column is the blasting index, m³ of rock per drilled linear metre (one
 * average value for all positions for now).
 *
 * Daily productivity follows the workbook's formulas:
 *   minutes per metre  = (drill one hole + rod lift + move to next hole) / hole depth
 *   speed              = 1 / minutes per metre                                  (m/min)
 *   blast relocation   = blasts per day · safe distance / travel speed          (min/day)
 *   per shift          = speed · (shift − relocation / shifts) · КИО · КТГ · efficiency
 *   per day            = per shift · shifts
 */

export interface RigCard {
  model: string;
  /** Average hole depth, m. */
  holeDepth: number;
  /** Minutes to drill one hole. */
  drillMinutes: number;
  /** Minutes to lift the rod. */
  liftMinutes: number;
  /** Minutes to move to the next hole. */
  moveMinutes: number;
  /** Travel speed, m/min. */
  travelSpeed: number;
  /** Safe distance from the blast, m. */
  safeDistance: number;
  blastsPerDay: number;
  shiftMinutes: number;
  shiftsPerDay: number;
  /** Equipment use factor (КИО), 0–1. */
  useFactor: number;
  /** Technical readiness factor (КТГ), 0–1. */
  readiness: number;
  /** Efficiency, 0–1. */
  efficiency: number;
  /** Blasted rock per drilled metre, m³/lm. */
  blastIndex: number;
}

type CardField = Exclude<keyof RigCard, 'model' | 'blastIndex'>;

/** Card row labels (Russian, as in the workbook; spelling variants tolerated). */
const LABELS: Array<[CardField, RegExp]> = [
  ['holeDepth', /глубин/],
  ['drillMinutes', /бурение одной/],
  ['liftMinutes', /подъ[её]м/],
  ['moveMinutes', /перегон на след/],
  ['travelSpeed', /скорост\S* передвиж/],
  ['safeDistance', /дистанц/],
  ['blastsPerDay', /количество взрыв|кличество взрыв/],
  ['shiftMinutes', /продолжительн\S* .*смен/],
  ['shiftsPerDay', /количество смен/],
  ['useFactor', /^кио$/],
  ['readiness', /^ктг$/],
  ['efficiency', /эффективн/],
];
/** "Модель бурового станка" (the workbook spells it "буравого"); a flat-list "Модель" header is not a card. */
const MODEL_LABEL = /модель .*станк/;
/** How far below a card's last row the blasting index may sit. */
const INDEX_SEARCH_ROWS = 6;
/** Rows a card may span. */
const CARD_ROWS = 30;

export function rigDailyLm(c: RigCard): number {
  const minPerMetre = (c.drillMinutes + c.liftMinutes + c.moveMinutes) / c.holeDepth;
  const relocation = (c.blastsPerDay * c.safeDistance) / c.travelSpeed;
  const perShift =
    (1 / minPerMetre) *
    (c.shiftMinutes - relocation / c.shiftsPerDay) *
    c.useFactor *
    c.readiness *
    c.efficiency;
  return perShift * c.shiftsPerDay;
}

/** Productivity model: works all shifts, productivity as an hourly average. */
export function modelFromCard(c: RigCard): DrillModel {
  const hoursPerDay = Math.min((c.shiftMinutes * c.shiftsPerDay) / 60, 24);
  return {
    id: c.model.trim().toLowerCase().replace(/\s+/g, ' '),
    name: c.model.trim(),
    hoursPerDay,
    byPosition: { '*': { productivity: rigDailyLm(c) / hoursPerDay, blastIndex: c.blastIndex } },
  };
}

const norm = (v: Cell | undefined) =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().toLowerCase() : '';
const num = (v: Cell | undefined): number | undefined => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v !== 'string') return undefined;
  const n = Number(v.replace(/\s/g, '').replace(',', '.'));
  return v.trim() !== '' && Number.isFinite(n) ? n : undefined;
};

export interface CardIssue {
  model: string;
  /** Card fields that are missing or not positive. */
  fields: Array<CardField | 'blastIndex'>;
}

/**
 * Read the parameter cards of the approved workbook layout. Returns null when the grid has no
 * card (then it is the flat list format).
 */
export function parseEquipmentCards(grid: Grid): { cards: RigCard[]; issues: CardIssue[] } | null {
  const cards: RigCard[] = [];
  const issues: CardIssue[] = [];
  grid.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (!MODEL_LABEL.test(norm(cell))) return;
      const model = String(row[c + 1] ?? '').trim();
      if (!model) return;
      const values: Partial<Record<CardField, number>> = {};
      let lastRow = r;
      for (let i = r + 1; i < Math.min(grid.length, r + CARD_ROWS); i++) {
        const label = norm(grid[i]?.[c]);
        if (!label) continue;
        if (MODEL_LABEL.test(label)) break;
        lastRow = i;
        const hit = LABELS.find(([f, re]) => values[f] === undefined && re.test(label));
        if (!hit) continue;
        const v = num(grid[i]?.[c + 2]);
        if (v !== undefined) values[hit[0]] = v;
      }
      let blastIndex: number | undefined;
      for (let i = lastRow + 1; i <= lastRow + INDEX_SEARCH_ROWS && i < grid.length; i++) {
        const v = num(grid[i]?.[c + 2]);
        if (v !== undefined && v > 0) {
          blastIndex = v;
          break;
        }
      }
      const missing: CardIssue['fields'] = LABELS.map(([f]) => f).filter(
        (f) => !((values[f] ?? 0) > 0),
      );
      if (blastIndex === undefined) missing.push('blastIndex');
      if (missing.length > 0) {
        issues.push({ model, fields: missing });
        return;
      }
      // Every field was checked to be a positive number just above.
      cards.push({ ...(values as Record<CardField, number>), model, blastIndex: blastIndex ?? 0 });
    }),
  );
  return cards.length > 0 || issues.length > 0 ? { cards, issues } : null;
}
