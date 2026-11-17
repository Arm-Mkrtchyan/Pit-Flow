import type { DrillAssignment, DrillingState, DrillSettings } from '../../types/domain';

export const DEFAULT_DRILL_SETTINGS: DrillSettings = {
  loadMinutesPerHole: 15,
  blastTime: '16:00',
  shiftStart: '08:00',
  hoursPerDay: 24,
};

export const defaultDrilling = (): DrillingState => ({
  blocks: [],
  range: null,
  rigs: [],
  assignments: {},
  settings: { ...DEFAULT_DRILL_SETTINGS },
});

/** Every drilling block shows at least one rig row; this is it until the user edits it. */
export const FIRST_ROW_ID = 'r0';
export const firstRow = (): DrillAssignment => ({
  rowId: FIRST_ROW_ID,
  rigId: null,
  start: null,
  drilledLm: 0,
});
