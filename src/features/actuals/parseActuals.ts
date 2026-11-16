import type { IsoDate } from '../../types/domain';
import { cellToIsoDate } from '../../shared/utils/dates';
import { parseNumber } from '../../shared/utils/numbers';
import {
  ACTUAL_GRADE_FIELDS,
  type ActualGradeField,
  type ActualRow,
  type ParsedActuals,
} from './types';

/**
 * Reads the ore-extraction table ("Добыча Руды") of a plan/actual workbook.
 * Header cells are located by their labels, not fixed columns:
 *   Ամսաթիվ (date) · Բլոկի № (block) · Հանքաքարի Հանույթ տոննա (tonnes, one sub-column per shift)
 *   Պարունակություն % (grades; sub-columns Cu, Mo, As, Pb)
 * The plan/actual column is found by its values (Պլան / Փաստ). Only Փաստ rows are used.
 */

type XLSXModule = typeof import('xlsx');
type Sheet = import('xlsx').WorkSheet;

const SHEET_NAME = /добыча\s*руды/i;
const DATE_LABEL = /ամսաթիվ/i;
const BLOCK_LABEL = /բլոկ/i;
const TONNES_LABEL = /հանքաքարի\s*հանույթ/i;
const GRADES_LABEL = /պարունակություն/i;
const ACTUAL_VALUE = 'փաստ';
const PLAN_VALUE = 'պլան';

const norm = (v: unknown): string =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().toLowerCase() : '';

export class ActualsFormatError extends Error {}

export async function parseActualsWorkbook(buffer: ArrayBuffer): Promise<ParsedActuals> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'array' });
  const candidates = [
    ...wb.SheetNames.filter((n) => SHEET_NAME.test(n)),
    ...wb.SheetNames.filter((n) => !SHEET_NAME.test(n)),
  ];
  for (const name of candidates) {
    const ws = wb.Sheets[name];
    if (!ws?.['!ref']) continue;
    const parsed = tryParseSheet(XLSX, ws, name);
    if (parsed) return parsed;
  }
  throw new ActualsFormatError('notFound');
}

function tryParseSheet(XLSX: XLSXModule, ws: Sheet, sheetName: string): ParsedActuals | null {
  const ref = ws['!ref'];
  if (!ref) return null;
  const range = XLSX.utils.decode_range(ref);
  const value = (r: number, c: number): unknown => ws[XLSX.utils.encode_cell({ r, c })]?.v;
  const merges = ws['!merges'] ?? [];
  /** Columns covered by a header cell (its merge range, if any). */
  const span = (r: number, c: number): [number, number] => {
    const m = merges.find((x) => x.s.r <= r && r <= x.e.r && x.s.c <= c && c <= x.e.c);
    return m ? [m.s.c, m.e.c] : [c, c];
  };

  // Header row: the first row (within the top 15) that has the date label.
  let headerRow = -1;
  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 15) && headerRow < 0; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      if (DATE_LABEL.test(norm(value(r, c)))) {
        headerRow = r;
        break;
      }
    }
  }
  if (headerRow < 0) return null;

  const findCol = (re: RegExp): number | null => {
    for (let c = range.s.c; c <= range.e.c; c++) if (re.test(norm(value(headerRow, c)))) return c;
    return null;
  };
  const dateCol = findCol(DATE_LABEL);
  const blockCol = findCol(BLOCK_LABEL);
  const tonnesCol = findCol(TONNES_LABEL);
  if (dateCol === null || blockCol === null || tonnesCol === null) return null;
  const [t0, t1] = span(headerRow, tonnesCol);
  const shiftCols = Array.from({ length: t1 - t0 + 1 }, (_, i) => t0 + i);

  // Sub-header row: first row below the header with a value in the first shift column.
  let subRow = headerRow + 1;
  while (subRow <= Math.min(range.e.r, headerRow + 4) && value(subRow, t0) === undefined) subRow++;
  const dataStart = subRow + 1;

  // Grade sub-columns (Cu, Mo, As, Pb) under "Պարունակություն %".
  const gradeCols: Partial<Record<ActualGradeField, number>> = {};
  const gradesCol = findCol(GRADES_LABEL);
  if (gradesCol !== null) {
    const [g0, g1] = span(headerRow, gradesCol);
    for (let c = g0; c <= g1; c++) {
      const label = norm(value(subRow, c)) as ActualGradeField;
      if (ACTUAL_GRADE_FIELDS.includes(label)) gradeCols[label] = c;
    }
  }

  // Plan/actual column: the column (left of the tonnes) where "Փաստ" occurs most often.
  let kindCol = -1;
  let best = 0;
  for (let c = range.s.c; c < t0; c++) {
    let n = 0;
    for (let r = dataStart; r <= Math.min(range.e.r, dataStart + 200); r++) {
      if (norm(value(r, c)) === ACTUAL_VALUE) n++;
    }
    if (n > best) {
      best = n;
      kindCol = c;
    }
  }
  if (kindCol < 0) return null;

  const rows: ActualRow[] = [];
  const skipped = { plan: 0, noName: 0, noTonnes: 0 };
  let firstDate: IsoDate | null = null;
  let lastDate: IsoDate | null = null;

  for (let r = dataStart; r <= range.e.r; r++) {
    const kind = norm(value(r, kindCol));
    if (kind === PLAN_VALUE) {
      skipped.plan++;
      continue;
    }
    if (kind !== ACTUAL_VALUE) continue;
    const date = cellToIsoDate(value(r, dateCol));
    if (!date) continue;
    if (!firstDate || date < firstDate) firstDate = date;
    if (!lastDate || date > lastDate) lastDate = date;
    const nameRaw = value(r, blockCol);
    const name = nameRaw === undefined || nameRaw === null ? '' : String(nameRaw).trim();
    const tonnes = shiftCols.reduce((s, c) => {
      const v = parseNumber(cellValue(value(r, c)));
      return s + (v !== undefined && Number.isFinite(v) && v > 0 ? v : 0);
    }, 0);
    if (!name) {
      if (tonnes > 0) skipped.noName++;
      continue;
    }
    if (tonnes <= 0) {
      skipped.noTonnes++;
      continue;
    }
    const grades: ActualRow['grades'] = {};
    for (const f of ACTUAL_GRADE_FIELDS) {
      const c = gradeCols[f];
      const v = c === undefined ? undefined : parseNumber(cellValue(value(r, c)));
      if (v !== undefined && Number.isFinite(v) && v >= 0) grades[f] = v;
    }
    rows.push({ row: r + 1, date, name, tonnes, grades });
  }
  return { sheetName, rows, skipped, firstDate, lastDate, shiftCount: shiftCols.length };
}

function cellValue(v: unknown): string | number | null {
  if (typeof v === 'number' || typeof v === 'string') return v;
  return null;
}
