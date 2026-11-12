/** All user-facing strings. Keys are flat, dot-separated. Use {name} for interpolation. */
export const en = {
  'app.title': 'Pit Flow',
  'app.subtitle': 'Mine block scheduler',
  'layout.blocks': 'Blocks',
  'layout.schedule': 'Schedule',
  'layout.calendar': 'Planning horizon',
  'schedule.empty': 'Load blocks and select a date range to build the schedule.',
  'calendar.placeholder': 'Select the planning horizon.',

  // Fields
  'field.elevation': 'Elevation',
  'field.group': 'Group',
  'field.material': 'Material',
  'field.volume': 'Volume',
  'field.weight': 'Weight',
  'field.cu': 'Cu',
  'field.mo': 'Mo',
  'field.as': 'As',
  'field.pb': 'Pb',
  'field.eq': 'Cu-eq',
  'field.density': 'Density',
  'field.remaining': 'Remaining',

  // Block classes
  'class.ore': 'Ore',
  'class.waste': 'Waste',
  'class.all': 'All',

  // Block list
  'blocks.empty': 'No blocks loaded. Upload a CSV or Excel file to start.',
  'blocks.noMatch': 'No blocks match the filters.',
  'blocks.search': 'Search block ID',
  'blocks.materialFilter': 'Material',
  'blocks.sort': 'Sort',
  'blocks.sort.id': 'ID',
  'blocks.sort.remaining': 'Remaining',
  'blocks.sort.cu': 'Cu',
  'blocks.sort.mo': 'Mo',
  'blocks.sort.eq': 'Cu-eq',
  'blocks.elevationGroup': 'Elevation {elevation} m',
  'blocks.count': '{shown} of {total} blocks',
  'blocks.locked': 'Locked',
  'blocks.lockedBy': 'Waiting for: {parents}',
  'blocks.exhausted': 'Exhausted',
  'blocks.listLabel': 'Block list. Use arrow keys to move and Enter to open.',

  // Import
  'import.upload': 'Upload blocks',
  'import.reading': 'Reading {name}…',
  'import.failed': 'Could not read {name}: {error}',
  'import.empty': 'The file is empty.',
  'import.mapping.title': 'Map columns',
  'import.mapping.intro':
    'Some required columns were not recognised in {name}. Choose which file column holds each field.',
  'import.mapping.field': 'Field',
  'import.mapping.column': 'File column',
  'import.mapping.sample': 'First value',
  'import.mapping.required': 'required',
  'import.mapping.notMapped': '— not in file —',
  'import.mapping.duplicate': 'Column "{column}" is used for more than one field.',
  'import.mapping.ok': 'Import',
  'import.reimport.title': 'Blocks already loaded',
  'import.reimport.intro':
    '{existing} blocks are loaded. The new file has {incoming} valid blocks. How should they be combined?',
  'import.reimport.replace': 'Replace all',
  'import.reimport.replaceHint':
    'Discard current blocks, remaining stock and dependencies; start fresh from the file.',
  'import.reimport.merge': 'Merge by block ID',
  'import.reimport.mergeHint':
    'Keep remaining stock and dependencies for matching IDs; add new blocks; remove blocks missing from the file.',
  'import.summary.title': 'Import summary — {name}',
  'import.summary.rows': 'Rows read',
  'import.summary.imported': 'Imported',
  'import.summary.skipped': 'Skipped',
  'import.summary.warnings': 'Warnings',
  'import.summary.ore': 'Ore blocks',
  'import.summary.waste': 'Waste blocks',
  'import.summary.format': 'Format',
  'import.summary.nothing': 'No valid rows were found, so the current blocks were not changed.',
  'import.summary.row': 'Row',
  'import.summary.level': 'Type',
  'import.summary.message': 'Details',
  'import.summary.error': 'Skipped',
  'import.summary.warning': 'Warning',
  'import.summary.parseErrors': 'File parsing problems',
  'import.summary.merge': 'Merge result',
  'import.summary.added': 'Added',
  'import.summary.updated': 'Kept user data',
  'import.summary.removed': 'Removed (not in file)',
  'import.summary.droppedDeps': 'Dependencies dropped (parent removed)',
  'import.summary.clamped': 'Remaining stock clamped to new weight',
  'import.summary.ignoredColumns': 'Ignored columns: {columns}',

  // Import validation messages
  'import.err.missing': '{field} is missing',
  'import.err.notNumber': '{field} is not a number',
  'import.err.negative': '{field} must be ≥ 0',
  'import.err.positive': '{field} must be > 0',
  'import.err.gradeMax': '{field} must be below 100 %',
  'import.warn.duplicateId': 'Duplicate ID {id}; renamed to {renamed}',
  'import.warn.density':
    'Volume × density = {expected} t differs from weight {weight} t by {diff} %',

  'common.cancel': 'Cancel',
  'common.close': 'Close',
} as const;

export type I18nKey = keyof typeof en;
