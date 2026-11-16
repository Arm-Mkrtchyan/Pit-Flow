import type { IsoDate } from '../../types/domain';

const pad = (n: number) => String(n).padStart(2, '0');
const MS_PER_DAY = 86_400_000;
/** Excel (1900 date system) day 0, as UTC milliseconds: 1899-12-30. */
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

function valid(y: number, m: number, d: number): IsoDate | null {
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/**
 * Spreadsheet cell → ISO date, without time-zone shifts. Accepts an Excel serial number,
 * a Date, or text "dd.mm.yyyy", "dd/mm/yyyy", "yyyy-mm-dd". Anything else → null.
 */
export function cellToIsoDate(v: unknown): IsoDate | null {
  if (typeof v === 'number') {
    if (!Number.isFinite(v) || v <= 0) return null;
    const dt = new Date(EXCEL_EPOCH + Math.floor(v) * MS_PER_DAY);
    return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
  }
  if (v instanceof Date) {
    return Number.isNaN(v.getTime())
      ? null
      : `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  }
  if (typeof v === 'string') {
    const s = v.trim();
    let m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(s);
    if (m) return valid(Number(m[3]), Number(m[2]), Number(m[1]));
    m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
    if (m) return valid(Number(m[1]), Number(m[2]), Number(m[3]));
  }
  return null;
}

/** "HH:mm" → minutes after midnight; null if malformed. */
export function clockToMinutes(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/** Minutes after midnight → "HH:mm". */
export function minutesToClock(minutes: number): string {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** ISO date → whole days since 1970-01-01 (UTC), for date arithmetic without time zones. */
export function isoToDayNumber(iso: IsoDate): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / MS_PER_DAY);
}

export function dayNumberToIso(day: number): IsoDate {
  const dt = new Date(day * MS_PER_DAY);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}
