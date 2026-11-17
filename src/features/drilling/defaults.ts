import type {
  DrillAssignment,
  DrillingState,
  DrillModel,
  DrillSettings,
  DrillUnit,
} from '../../types/domain';
import { modelFromCard, type RigCard } from './equipmentCard';
import { matchModel, rigIdOf } from './rigList';

export const DEFAULT_DRILL_SETTINGS: DrillSettings = {
  loadMinutesPerHole: 5,
  installMinutes: 60,
  blastTime: '16:00',
  shiftStart: '08:00',
  hoursPerDay: 24,
};

/** Shared parameters of the approved workbook's cards (3 shifts of 8 h, one blast a day). */
const COMMON = {
  holeDepth: 17,
  safeDistance: 250,
  blastsPerDay: 1,
  shiftMinutes: 480,
  shiftsPerDay: 3,
  useFactor: 0.875,
  readiness: 0.8,
  efficiency: 1,
} as const;

/**
 * Approved productivity per rig model (fixtures/drilling.equipments.xlsx), the default until
 * the user uploads another. To update it, change these values or upload the revised workbook.
 */
export const DEFAULT_RIG_CARDS: readonly RigCard[] = [
  {
    ...COMMON,
    model: 'Atlas Copco DM-45-50',
    drillMinutes: 31.8,
    liftMinutes: 2,
    moveMinutes: 2,
    travelSpeed: 26.7,
    blastIndex: 22,
  },
  {
    ...COMMON,
    model: 'СБШ-250',
    drillMinutes: 42,
    liftMinutes: 9,
    moveMinutes: 3,
    travelSpeed: 21.6,
    blastIndex: 28,
  },
  {
    ...COMMON,
    model: 'Atlas Copco DM-60/ L8',
    drillMinutes: 24.23,
    liftMinutes: 1.73,
    moveMinutes: 1.25,
    travelSpeed: 18.75,
    blastIndex: 15,
  },
];

export const defaultModels = (): DrillModel[] => DEFAULT_RIG_CARDS.map(modelFromCard);

/** Working rigs (fixtures/drilling.equipment.list.csv), the default rig list. */
export const DEFAULT_RIG_NAMES: readonly string[] = [
  'СБШ - 2',
  'СБШ - 3',
  'СБШ - 4',
  'СБШ - 9',
  'DM 45 - 1',
  'DM 50 - 2',
  'DM 50 - 3',
  'D60 - 1',
  'L8 - 1',
  'D65 - 1',
];

/** The default rigs, each matched to one of `models` by name. */
export const defaultRigs = (models: readonly DrillModel[] = defaultModels()): DrillUnit[] =>
  DEFAULT_RIG_NAMES.map((name) => ({
    id: rigIdOf(name),
    name,
    modelId: matchModel(name, models),
  }));

export const defaultDrilling = (): DrillingState => ({
  blocks: [],
  range: null,
  models: defaultModels(),
  rigs: defaultRigs(),
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
