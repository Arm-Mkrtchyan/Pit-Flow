const PALETTE = [
  'geekblue',
  'volcano',
  'cyan',
  'purple',
  'gold',
  'magenta',
  'lime',
  'orange',
  'blue',
  'green',
] as const;
const FIXED: Record<string, (typeof PALETTE)[number]> = { MF: 'geekblue', WD: 'volcano' };

/** Deterministic antd preset colour for a material code. */
export function materialColor(code: string): string {
  const fixed = FIXED[code.toUpperCase()];
  if (fixed) return fixed;
  let h = 0;
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length] ?? 'default';
}
