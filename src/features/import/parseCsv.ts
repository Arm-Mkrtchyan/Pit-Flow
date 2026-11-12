import Papa from 'papaparse';
import type { Grid } from './types';

/** Parse CSV text into a grid of raw string cells (one per line), auto-detecting the delimiter. */
export function parseCsvText(text: string): { grid: Grid; delimiter: string; errors: string[] } {
  const result = Papa.parse<string[]>(text, {
    delimitersToGuess: [',', ';', '\t', '|'],
    // Keep empty lines so grid index + 1 equals the file line number; they are skipped later.
    skipEmptyLines: false,
  });
  const errors = result.errors.map((e) =>
    e.row !== undefined ? `Row ${e.row + 1}: ${e.message}` : e.message,
  );
  return { grid: result.data, delimiter: result.meta.delimiter, errors };
}
