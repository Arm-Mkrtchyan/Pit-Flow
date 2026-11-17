import type { DrillSourceBlock, IsoDate } from '../../types/domain';
import { t } from '../../shared/i18n/t';
import { parseNumber, parseString } from '../../shared/utils/numbers';
import { cellToIsoDate } from '../../shared/utils/dates';
import { isBlankRow, type ImportIssue, type ParsedFile } from '../import';
import { accumulate, daysBetween, finish, locationKey, type Acc } from './drillSource';

/** Normalised header names of the production schedule (e.g. production_detailed.csv). */
const COLUMNS = {
  location: 'mining location',
  start: 'start date',
  end: 'end date',
  elevation: 'elevation',
  volume: 'volume',
  material: 'material',
} as const;
type Column = keyof typeof COLUMNS;
const REQUIRED: Column[] = ['location', 'start', 'elevation', 'volume'];

const normalize = (h: string) =>
  h
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export interface DrillImportResult {
  blocks: DrillSourceBlock[];
  issues: ImportIssue[];
  /** Non-blank data rows in the file. */
  totalRows: number;
  /** Rows that were summed into a location. */
  usedRows: number;
  /** First and last mining day in the file. */
  period: [IsoDate, IsoDate] | null;
}

/**
 * Read a production schedule: one row per period × Mining Location × cell × material.
 * Rows are grouped by Mining Location: volume = Σ Volume (m³, all materials), mining days =
 * every day of each row's period (Start Date inclusive, End Date exclusive).
 * Throws when a required column is missing.
 */
export function parseProductionSchedule(file: ParsedFile): DrillImportResult {
  const headers = file.headers.map(normalize);
  const col = {} as Record<Column, number>;
  for (const k of Object.keys(COLUMNS) as Column[]) col[k] = headers.indexOf(COLUMNS[k]);
  const missing = REQUIRED.filter((k) => col[k] < 0).map((k) => COLUMNS[k]);
  if (missing.length > 0) {
    throw new Error(t('drilling.import.missingColumns', { columns: missing.join(', ') }));
  }

  const issues: ImportIssue[] = [];
  const byKey = new Map<string, Acc>();
  let totalRows = 0;
  let usedRows = 0;

  file.rows.forEach((row, i) => {
    if (isBlankRow(row)) return;
    totalRows++;
    const rowNumber = file.headerRowNumber + 1 + i;
    const cell = (k: Column) => (col[k] >= 0 ? row[col[k]] : undefined);
    const error = (message: string) => issues.push({ level: 'error', row: rowNumber, message });

    const location = parseString(cell('location'));
    const startCell = cell('start');
    const start = startCell == null ? null : cellToIsoDate(startCell);
    const endCell = cell('end');
    const endRaw = parseString(endCell);
    const end = endCell == null || endRaw === undefined ? undefined : cellToIsoDate(endCell);
    const elevation = parseNumber(cell('elevation'));
    const volume = parseNumber(cell('volume'));

    if (location === undefined) return error(t('drilling.import.noLocation'));
    if (!start) {
      return error(t('drilling.import.badDate', { value: String(startCell ?? '') }));
    }
    if (end === null) return error(t('drilling.import.badDate', { value: endRaw ?? '' }));
    if (elevation === undefined || !Number.isFinite(elevation)) {
      return error(t('drilling.import.badNumber', { field: COLUMNS.elevation }));
    }
    if (volume === undefined || !Number.isFinite(volume) || volume < 0) {
      return error(t('drilling.import.badNumber', { field: COLUMNS.volume }));
    }

    const key = locationKey(location);
    const acc = accumulate(byKey, location, key, elevation);
    if (acc.block.location !== location) {
      issues.push({
        level: 'warning',
        row: rowNumber,
        message: t('drilling.import.sameKey', { location, other: acc.block.location }),
      });
    }
    acc.block.volume += volume;
    for (const d of daysBetween(start, end)) acc.days.add(d);
    const material = parseString(cell('material'));
    if (material !== undefined) acc.materials.add(material.toUpperCase());
    usedRows++;
  });

  const blocks = finish(byKey);
  const allDays = blocks.flatMap((b) => b.miningDays).sort();
  const first = allDays[0];
  const last = allDays.at(-1);
  return {
    blocks,
    issues,
    totalRows,
    usedRows,
    period: first !== undefined && last !== undefined ? [first, last] : null,
  };
}
