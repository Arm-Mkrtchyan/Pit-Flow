const LOCALE = 'en-US';

const tonnesFmt = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const gradeFmt = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});
const gptFmt = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const pctFmt = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});
const plainFmt = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 3 });

const DASH = '—';
const ok = (v: number | null | undefined): v is number =>
  typeof v === 'number' && Number.isFinite(v);

/** Tonnes with thousands separators, no decimals. */
export const fmtTonnes = (v: number | null | undefined): string =>
  ok(v) ? tonnesFmt.format(v) : DASH;
/** Grade in %, 3 decimals (value is already in %). */
export const fmtGrade = (v: number | null | undefined): string =>
  ok(v) ? gradeFmt.format(v) : DASH;
/** Impurity in g/t, 1 decimal. */
export const fmtGpt = (v: number | null | undefined): string => (ok(v) ? gptFmt.format(v) : DASH);
/** Relative deviation given as a fraction (0.05 → "+5.0 %"). */
export const fmtDeviation = (v: number | null | undefined): string =>
  ok(v) ? `${pctFmt.format(v * 100)} %` : DASH;
/** Generic number, up to 3 decimals. */
export const fmtNumber = (v: number | null | undefined): string =>
  ok(v) ? plainFmt.format(v) : DASH;

/** Format by row unit: t → tonnes, % → grade, g/t → impurity. */
export const fmtByUnit = (v: number | null | undefined, unit: 't' | '%' | 'g/t'): string =>
  unit === 't' ? fmtTonnes(v) : unit === '%' ? fmtGrade(v) : fmtGpt(v);
