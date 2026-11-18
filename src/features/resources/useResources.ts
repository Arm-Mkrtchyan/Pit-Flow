import { useCallback, useMemo, useState } from 'react';
import { App } from 'antd';
import { t } from '../../shared/i18n/t';
import { ActualsFormatError, parseActualsWorkbook, type ParsedActuals } from '../actuals';
import { downloadBlob } from '../export';
import {
  encodeResourceFile,
  readResourceFile,
  updateResourceCsv,
  type ResourceFile,
} from './resourceCsv';
import { actualTotals } from './totals';

/**
 * State of the resource page: the actual workbook and the resource file, held in memory only
 * (re-upload after a reload). The updated file is derived from both.
 */
export function useResources() {
  const { message } = App.useApp();
  const [actuals, setActuals] = useState<{ name: string; parsed: ParsedActuals } | null>(null);
  const [resource, setResource] = useState<{ name: string; file: ResourceFile } | null>(null);
  const [loading, setLoading] = useState<'actuals' | 'resource' | null>(null);

  const fail = useCallback(
    (name: string, e: unknown) => {
      const error =
        e instanceof ActualsFormatError
          ? t('actuals.notFound')
          : e instanceof Error
            ? e.message
            : String(e);
      void message.error(t('import.failed', { name, error }));
    },
    [message],
  );

  const loadActuals = useCallback(
    async (f: File) => {
      setLoading('actuals');
      try {
        const parsed = await parseActualsWorkbook(await f.arrayBuffer());
        if (parsed.rows.length === 0) void message.warning(t('actuals.empty', { name: f.name }));
        setActuals({ name: f.name, parsed });
      } catch (e) {
        fail(f.name, e);
      } finally {
        setLoading(null);
      }
    },
    [fail, message],
  );

  const loadResource = useCallback(
    async (f: File) => {
      setLoading('resource');
      try {
        setResource({ name: f.name, file: readResourceFile(await f.arrayBuffer()) });
      } catch (e) {
        fail(f.name, e);
      } finally {
        setLoading(null);
      }
    },
    [fail],
  );

  const totals = useMemo(() => (actuals ? actualTotals(actuals.parsed.rows) : null), [actuals]);
  const result = useMemo(
    () => (resource && totals ? updateResourceCsv(resource.file.text, totals) : null),
    [resource, totals],
  );

  const download = useCallback(() => {
    if (!resource || !result) return;
    const bytes = encodeResourceFile(resource.file, result.text);
    downloadBlob(new Blob([bytes], { type: 'text/csv' }), resource.name);
  }, [resource, result]);

  return { actuals, resource, loading, loadActuals, loadResource, result, download };
}
