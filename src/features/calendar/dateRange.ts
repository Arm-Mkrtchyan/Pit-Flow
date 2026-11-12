import dayjs, { type Dayjs } from 'dayjs';
import type { IsoDate } from '../../types/domain';

export const ISO = 'YYYY-MM-DD';
export const MAX_HORIZON_DAYS = 366;

export const toIso = (d: Dayjs): IsoDate => d.format(ISO);
export const fromIso = (d: IsoDate): Dayjs => dayjs(d, ISO);

/** All dates from start to end inclusive. */
export function enumerateDays(range: readonly [IsoDate, IsoDate] | null): IsoDate[] {
  if (!range) return [];
  const start = fromIso(range[0]);
  const n = Math.min(fromIso(range[1]).diff(start, 'day') + 1, MAX_HORIZON_DAYS);
  return Array.from({ length: Math.max(n, 0) }, (_, i) => toIso(start.add(i, 'day')));
}

/** `days` days starting tomorrow. */
export function nextDaysRange(days: number, today: Dayjs = dayjs()): [IsoDate, IsoDate] {
  const start = today.startOf('day').add(1, 'day');
  return [toIso(start), toIso(start.add(days - 1, 'day'))];
}
