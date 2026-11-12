/** All user-facing strings. Keys are flat, dot-separated. Use {name} for interpolation. */
export const en = {
  'app.title': 'Pit Flow',
  'app.subtitle': 'Mine block scheduler',
  'layout.blocks': 'Blocks',
  'layout.schedule': 'Schedule',
  'layout.calendar': 'Planning horizon',
  'blocks.empty': 'No blocks loaded. Upload a CSV or Excel file to start.',
  'blocks.upload': 'Upload blocks',
  'schedule.empty': 'Load blocks and select a date range to build the schedule.',
  'calendar.placeholder': 'Select the planning horizon.',
} as const;

export type I18nKey = keyof typeof en;
