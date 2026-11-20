import type { IsoDate } from '../../types/domain';
import { cellToIsoDate } from '../../shared/utils/dates';
import { parseNumber } from '../../shared/utils/numbers';
import { planKey } from './blockKey';
import type { DeviationCategory, ParsedPlan, PlanEntry } from './types';

/*
 * Weekly mining plan ("План горных работ … на период …"): sheets "Блоки CuEq" (ore, CuEq at or
 * above the cutoff) and "Блоки CuEq ниже порога" (below the cutoff). Each has a header row
 * "Блок, Участок, …" followed by one column per date; one row per block with tonnes per date.
 * Rows "ИТОГО" and notes below the table are skipped.
 */

const SHEETS: ReadonlyArray<{ re: RegExp; fallback: DeviationCategory }> = [
  // Below-threshold first: its name also matches the ore sheet's pattern.
  { re: /блоки\s*cueq\s*ниже\s*порога/i, fallback: 'overburden' },
  { re: /блоки\s*cueq/i, fallback: 'crusher' },
];
const BLOCK_LABEL = /^блок$/i;
const TOTAL = /^итого/i;
const STOCKPILE = /^osp\s*\d+$/i;

export class PlanFormatError extends Error {}

/**
 * Destination of a planned block by its name: "wd" → overburden; a pit block that also names
 * "osp" goes to an OSP stockpile; a stockpile itself ("osp8") is reclaimed to the crusher;
 * "mf" → crusher; anything else by its sheet.
 */
export function planCategory(name: string, fallback: DeviationCategory): DeviationCategory {
  const n = name.trim().toLowerCase();
  if (STOCKPILE.test(n)) return 'crusher';
  if (/wd/.test(n)) return 'overburden';
  if (/osp/.test(n)) return 'osp';
  if (/mf/.test(n)) return 'crusher';
  return fallback;
}

export async function parsePlanWorkbook(buffer: ArrayBuffer): Promise<ParsedPlan> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(buffer, { type: 'array' });
  const entries: PlanEntry[] = [];
  const dates = new Set<IsoDate>();
  const used = new Set<string>();
  let found = 0;

  for (const { re, fallback } of SHEETS) {
    const sheetName = wb.SheetNames.find((n) => re.test(n.trim()) && !used.has(n));
    const ws = sheetName ? wb.Sheets[sheetName] : undefined;
    if (!sheetName || !ws?.['!ref']) continue;
    used.add(sheetName);
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null });

    const headerIdx = rows.findIndex((r) =>
      r.some((v) => typeof v === 'string' && BLOCK_LABEL.test(v.trim())),
    );
    const header = rows[headerIdx];
    if (!header) continue;
    found++;
    const nameCol = header.findIndex((v) => typeof v === 'string' && BLOCK_LABEL.test(v.trim()));
    // Date columns: header cells that read as dates (numbers or Date cells).
    const dateCols: Array<{ col: number; date: IsoDate }> = [];
    header.forEach((v, col) => {
      if (typeof v !== 'number' && !(v instanceof Date)) return;
      const date = cellToIsoDate(v);
      if (date) dateCols.push({ col, date });
    });
    dateCols.forEach((d) => dates.add(d.date));

    for (const row of rows.slice(headerIdx + 1)) {
      const raw = row[nameCol];
      const name = typeof raw === 'string' ? raw.trim() : '';
      if (!name || TOTAL.test(name) || /\s/.test(name)) continue; // totals, notes
      const category = planCategory(name, fallback);
      const key = planKey(name);
      for (const { col, date } of dateCols) {
        const cell = row[col];
        const v = parseNumber(typeof cell === 'number' || typeof cell === 'string' ? cell : null);
        if (v !== undefined && Number.isFinite(v) && v > 0)
          entries.push({ date, key, name, category, tonnes: v });
      }
    }
  }
  if (found === 0) throw new PlanFormatError('notFound');
  return { dates: [...dates].sort(), entries };
}
