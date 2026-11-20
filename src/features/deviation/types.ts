import type { IsoDate } from '../../types/domain';

/** Destination groups of the deviation table. */
export type DeviationCategory = 'crusher' | 'osp' | 'overburden';
export const DEVIATION_CATEGORIES: readonly DeviationCategory[] = ['crusher', 'osp', 'overburden'];

/** Sections of each day: ore (to the crusher and the OSP stockpiles) first, then overburden. */
export type DeviationSection = 'ore' | 'overburden';
export const SECTION_CATEGORIES: Record<DeviationSection, readonly DeviationCategory[]> = {
  ore: ['crusher', 'osp'],
  overburden: ['overburden'],
};

/** Work order (Наряд), weekly plan (План) and actual (Факт), tonnes. */
export interface Triple {
  order: number;
  plan: number;
  fact: number;
}

export interface DeviationRow {
  key: string;
  /** `section`: separator row naming the section (ore / overburden) that follows. */
  kind: 'section' | 'block' | 'subtotal' | 'total';
  /** Section of block and subtotal rows; undefined on the grand total. */
  section?: DeviationSection;
  /** Null on the grand total. */
  date: IsoDate | null;
  /** Block name in the actual file's style ("SS1890-48", "OSP8"); empty on total rows. */
  block: string;
  values: Record<DeviationCategory, Triple>;
  /** False when the date has no actual data yet: Факт and Вып. are shown empty. */
  hasFact: boolean;
  /**
   * References for Вып. when they differ from `values` (grand total: only the order and plan of
   * dates that already have actual data, so future days don't count as a shortfall).
   */
  execRef?: Record<DeviationCategory, Triple>;
}

/** One block-date tonnage from the weekly plan file. */
export interface PlanEntry {
  date: IsoDate;
  /** Matching key, e.g. "ss1890-48" or "osp8". */
  key: string;
  /** Name as written in the plan file. */
  name: string;
  category: DeviationCategory;
  tonnes: number;
}

export interface ParsedPlan {
  /** Plan period: the date columns of the plan sheets, ascending. */
  dates: IsoDate[];
  entries: PlanEntry[];
}
