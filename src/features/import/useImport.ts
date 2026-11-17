import { useCallback, useState } from 'react';
import { App } from 'antd';
import { useAppStore } from '../../store';
import { t } from '../../shared/i18n/t';
import { autoMapColumns, mappingToHeaderMap } from './columns';
import { mapRows } from './mapRows';
import { applyImport, type MergeReport, type ReimportMode } from './merge';
import { readBlockFile } from './readFile';
import type { FieldMapping, MappedResult, ParsedFile } from './types';

interface Ctx {
  file: ParsedFile;
  parseErrors: string[];
  mapping: FieldMapping;
}

export type ImportStep =
  | { kind: 'idle' }
  | { kind: 'reading'; name: string }
  | ({ kind: 'mapping' } & Ctx)
  | ({ kind: 'reimport'; result: MappedResult } & Ctx)
  | ({ kind: 'summary'; result: MappedResult; report?: MergeReport; mode?: ReimportMode } & Ctx);

/**
 * Drives the extraction block import: read → (map columns) → validate → (replace/merge) → summary.
 * The drilling page has its own import (production schedule, `features/drilling`).
 */
export function useImport() {
  const [step, setStep] = useState<ImportStep>({ kind: 'idle' });
  const { message } = App.useApp();

  const apply = useCallback((ctx: Ctx, result: MappedResult, mode: ReimportMode) => {
    const { blocks, userInputs, setBlocks } = useAppStore.getState();
    const merged = applyImport(mode, result.blocks, blocks, userInputs);
    setBlocks(merged.blocks, merged.userInputs);
    setStep({
      kind: 'summary',
      ...ctx,
      result,
      report: mode === 'merge' ? merged.report : undefined,
      mode,
    });
  }, []);

  const validate = useCallback(
    (ctx: Ctx) => {
      const result = mapRows(ctx.file, ctx.mapping);
      if (result.blocks.length === 0) {
        setStep({ kind: 'summary', ...ctx, result });
        return;
      }
      if (useAppStore.getState().blocks.length > 0) {
        setStep({ kind: 'reimport', ...ctx, result });
      } else {
        apply(ctx, result, 'replace');
      }
    },
    [apply],
  );

  const handleFile = useCallback(
    async (f: File) => {
      setStep({ kind: 'reading', name: f.name });
      try {
        const { file, parseErrors } = await readBlockFile(f.name, await f.arrayBuffer());
        const last = useAppStore.getState().settings.lastColumnMapping;
        const { mapping, missingRequired } = autoMapColumns(file.headers, last);
        const ctx: Ctx = { file, parseErrors, mapping };
        if (missingRequired.length > 0) setStep({ kind: 'mapping', ...ctx });
        else validate(ctx);
      } catch (e) {
        setStep({ kind: 'idle' });
        const error = e instanceof Error ? e.message : String(e);
        void message.error(t('import.failed', { name: f.name, error }));
      }
    },
    [message, validate],
  );

  const confirmMapping = useCallback(
    (mapping: FieldMapping) => {
      if (step.kind !== 'mapping') return;
      useAppStore.getState().setLastColumnMapping(mappingToHeaderMap(step.file.headers, mapping));
      validate({ file: step.file, parseErrors: step.parseErrors, mapping });
    },
    [step, validate],
  );

  const chooseMode = useCallback(
    (mode: ReimportMode) => {
      if (step.kind !== 'reimport') return;
      apply(step, step.result, mode);
    },
    [step, apply],
  );

  const close = useCallback(() => setStep({ kind: 'idle' }), []);

  return { step, handleFile, confirmMapping, chooseMode, close };
}
