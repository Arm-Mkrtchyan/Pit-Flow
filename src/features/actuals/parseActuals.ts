import type { IsoDate } from '../../types/domain';
import { cellToIsoDate } from '../../shared/utils/dates';
import { parseNumber } from '../../shared/utils/numbers';
import {
  ACTUAL_GRADE_FIELDS,
  type ActualGradeField,
  type ActualRow,
  type OrderFactRow,
  type ParsedActuals,
  type ParsedOrderFact,
} from './types';

/**
 * Reads the ore-extraction table ("Добыча Руды") of a plan/actual workbook.
 * Header cells are located by their labels, not fixed columns:
 *   Ամսաթիվ (date) · Բլոկի № (block) · Հանքաքարի Հանույթ տոննա (tonnes, one sub-column per shift)
 *   Հանքաքարի Պահեստ (OSP…) տոննա (ore sent to a stockpile, one sub-column per shift)
 *   Մակաբացում տոննա (overburden, one sub-column per shift)
 *   Պարունակություն % (grades; sub-columns Cu, Mo, As, Pb)
 * The plan/actual column is found by its values (Պլան / Փաստ). Each date has pairs of rows:
 * Պլան (the work order; its block cell is usually empty) followed by Փաստ (actual, with the block).
 */

type XLSXModule = typeof import('xlsx');
type Sheet = import('xlsx').WorkSheet;

const SHEET_NAME = /добыча\s*руды/i;
const DATE_LABEL = /ամսաթիվ/i;
const BLOCK_LABEL = /բլոկ/i;
const TONNES_LABEL = /հանքաքարի\s*հանույթ/i;
/** Ore sent from the block to a stockpile (OSP8, OSP9, …), one sub-column per shift. */
const STOCKPILE_LABEL = /հանքաքարի\s*պահեստ/i;
/** Overburden (stripping), one sub-column per shift. */
const OVERBURDEN_LABEL = /մակաբացում/i;
const GRADES_LABEL = /պարունակություն/i;
const ACTUAL_VALUE = 'փաստ';
const PLAN_VALUE = 'պլան';

const norm = (v: unknown): string =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().toLowerCase() : '';

export class ActualsFormatError extends Error {}

/** The located table of one sheet: header rows and the key columns. */
interface Table {
  sheetName: string;
  value: (r: number, c: number) => unknown;
  lastRow: number;
  headerRow: number;
  /** Columns covered by a header cell (its merge range, if any). */
  span: (r: number, c: number) => [number, number];
  subRow: number;
  dataStart: number;
  dateCol: number;
  blockCol: number;
  kindCol: number;
  /** First column of the ore tonnes group. */
  tonnesCol: number;
  findCol: (re: RegExp) => number | null;
  /**
   * Columns of every header group matching `re` (merged header cells). With `shiftsOnly`, only
   * sub-columns whose sub-header is a shift number (skips a daily-total column in the group).
   */
  groupCols: (re: RegExp, shiftsOnly?: boolean) => number[];
}

async function readTable(buffer: ArrayBuffer): Promise<Table> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'array' });
  const candidates = [
    ...wb.SheetNames.filter((n) => SHEET_NAME.test(n)),
    ...wb.SheetNames.filter((n) => !SHEET_NAME.test(n)),
  ];
  for (const name of candidates) {
    const ws = wb.Sheets[name];
    if (!ws?.['!ref']) continue;
    const table = locateTable(XLSX, ws, name);
    if (table) return table;
  }
  throw new ActualsFormatError('notFound');
}

function locateTable(XLSX: XLSXModule, ws: Sheet, sheetName: string): Table | null {
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

  // Sub-header row: first row below the header with a value in the first shift column.
  let subRow = headerRow + 1;
  while (subRow <= Math.min(range.e.r, headerRow + 4) && value(subRow, tonnesCol) === undefined)
    subRow++;
  const dataStart = subRow + 1;

  const groupCols = (re: RegExp, shiftsOnly = false): number[] => {
    const cols: number[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      if (!re.test(norm(value(headerRow, c)))) continue;
      const [s0, s1] = span(headerRow, c);
      for (let k = s0; k <= s1; k++) {
        if (!shiftsOnly || /^\d+$/.test(String(value(subRow, k) ?? '').trim())) cols.push(k);
      }
      c = s1;
    }
    return cols;
  };

  // Plan/actual column: the column (left of the tonnes) where "Փաստ" occurs most often.
  let kindCol = -1;
  let best = 0;
  for (let c = range.s.c; c < tonnesCol; c++) {
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

  return {
    sheetName,
    value,
    lastRow: range.e.r,
    headerRow,
    span,
    subRow,
    dataStart,
    dateCol,
    blockCol,
    kindCol,
    tonnesCol,
    findCol,
    groupCols,
  };
}

function cellValue(v: unknown): string | number | null {
  if (typeof v === 'number' || typeof v === 'string') return v;
  return null;
}

/** Sum of the positive numbers in `cols` of row `r`. */
const sumCols = (table: Table, r: number, cols: readonly number[]): number =>
  cols.reduce((s, c) => {
    const v = parseNumber(cellValue(table.value(r, c)));
    return s + (v !== undefined && Number.isFinite(v) && v > 0 ? v : 0);
  }, 0);

const blockName = (table: Table, r: number): string => {
  const raw = table.value(r, table.blockCol);
  return raw === undefined || raw === null ? '' : String(raw).trim();
};

/** Actual (Փաստ) extraction per block and date, for applying actuals to the block list. */
export async function parseActualsWorkbook(buffer: ArrayBuffer): Promise<ParsedActuals> {
  const table = await readTable(buffer);
  const { value, dataStart, dateCol, kindCol, subRow, sheetName, headerRow, span } = table;
  const [t0, t1] = span(headerRow, table.tonnesCol);
  const shiftCols = Array.from({ length: t1 - t0 + 1 }, (_, i) => t0 + i);
  const stockpileCols = table.groupCols(STOCKPILE_LABEL);

  // Grade sub-columns (Cu, Mo, As, Pb) under "Պարունակություն %".
  const gradeCols: Partial<Record<ActualGradeField, number>> = {};
  const gradesCol = table.findCol(GRADES_LABEL);
  if (gradesCol !== null) {
    const [g0, g1] = span(headerRow, gradesCol);
    for (let c = g0; c <= g1; c++) {
      const label = norm(value(subRow, c)) as ActualGradeField;
      if (ACTUAL_GRADE_FIELDS.includes(label)) gradeCols[label] = c;
    }
  }

  const rows: ActualRow[] = [];
  const skipped = { plan: 0, noName: 0, noTonnes: 0 };
  let firstDate: IsoDate | null = null;
  let lastDate: IsoDate | null = null;

  for (let r = dataStart; r <= table.lastRow; r++) {
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
    const name = blockName(table, r);
    const tonnes = sumCols(table, r, shiftCols);
    const stockpileTonnes = sumCols(table, r, stockpileCols);
    if (!name) {
      if (tonnes + stockpileTonnes > 0) skipped.noName++;
      continue;
    }
    if (tonnes + stockpileTonnes <= 0) {
      skipped.noTonnes++;
      continue;
    }
    const grades: ActualRow['grades'] = {};
    for (const f of ACTUAL_GRADE_FIELDS) {
      const c = gradeCols[f];
      const v = c === undefined ? undefined : parseNumber(cellValue(value(r, c)));
      if (v !== undefined && Number.isFinite(v) && v >= 0) grades[f] = v;
    }
    rows.push({ row: r + 1, date, name, tonnes, stockpileTonnes, grades });
  }
  return { sheetName, rows, skipped, firstDate, lastDate, shiftCount: shiftCols.length };
}

/**
 * Work order (Պլան) and actual (Փաստ) tonnes per block and date, split by destination:
 * ore extracted (to the crusher), ore to the OSP stockpiles, overburden. Shift columns only;
 * oxidised ore is not read. A Պլան row without a block takes the block of its Փաստ row.
 */
export async function parseOrderFactWorkbook(buffer: ArrayBuffer): Promise<ParsedOrderFact> {
  const table = await readTable(buffer);
  const { value, dataStart, dateCol, kindCol, sheetName } = table;
  const ore = table.groupCols(TONNES_LABEL, true);
  const osp = table.groupCols(STOCKPILE_LABEL, true);
  const overburden = table.groupCols(OVERBURDEN_LABEL, true);

  const rows: OrderFactRow[] = [];
  const factDates = new Set<IsoDate>();
  let firstDate: IsoDate | null = null;
  let lastDate: IsoDate | null = null;

  for (let r = dataStart; r <= table.lastRow; r++) {
    const k = norm(value(r, kindCol));
    if (k !== PLAN_VALUE && k !== ACTUAL_VALUE) continue;
    const date = cellToIsoDate(value(r, dateCol));
    if (!date) continue;
    let name = blockName(table, r);
    if (!name && k === PLAN_VALUE && norm(value(r + 1, kindCol)) === ACTUAL_VALUE)
      name = blockName(table, r + 1);
    const values = {
      crusher: sumCols(table, r, ore),
      osp: sumCols(table, r, osp),
      overburden: sumCols(table, r, overburden),
    };
    if (!name || values.crusher + values.osp + values.overburden <= 0) continue;
    const kind = k === PLAN_VALUE ? 'order' : 'fact';
    if (kind === 'fact') factDates.add(date);
    if (!firstDate || date < firstDate) firstDate = date;
    if (!lastDate || date > lastDate) lastDate = date;
    rows.push({ row: r + 1, date, kind, name, ...values });
  }
  return { sheetName, rows, factDates: [...factDates].sort(), firstDate, lastDate };
}
