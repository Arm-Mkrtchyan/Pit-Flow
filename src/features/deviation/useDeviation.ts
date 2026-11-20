import { useCallback, useMemo, useState } from 'react';
import { App } from 'antd';
import { t } from '../../shared/i18n/t';
import { ActualsFormatError, parseOrderFactWorkbook, type ParsedOrderFact } from '../actuals';
import { computeDeviation } from './compute';
import { PlanFormatError, parsePlanWorkbook } from './parsePlanFile';
import type { ParsedPlan } from './types';
import { deviationFileName, exportDeviationXlsx } from './deviationXlsx';

/**
 * State of the deviation page: the weekly plan and the plan/actual workbook, held in memory
 * only (re-upload after a reload). The table is derived from both.
 */
export function useDeviation() {
  const { message } = App.useApp();
  const [plan, setPlan] = useState<{ name: string; parsed: ParsedPlan } | null>(null);
  const [actuals, setActuals] = useState<{ name: string; parsed: ParsedOrderFact } | null>(null);
  const [loading, setLoading] = useState<'plan' | 'actuals' | 'export' | null>(null);

  const fail = useCallback(
    (name: string, e: unknown) => {
      const error =
        e instanceof ActualsFormatError
          ? t('actuals.notFound')
          : e instanceof PlanFormatError
            ? t('deviation.plan.notFound')
            : e instanceof Error
              ? e.message
              : String(e);
      void message.error(t('import.failed', { name, error }));
    },
    [message],
  );

  const loadPlan = useCallback(
    async (f: File) => {
      setLoading('plan');
      try {
        setPlan({ name: f.name, parsed: await parsePlanWorkbook(await f.arrayBuffer()) });
      } catch (e) {
        fail(f.name, e);
      } finally {
        setLoading(null);
      }
    },
    [fail],
  );

  const loadActuals = useCallback(
    async (f: File) => {
      setLoading('actuals');
      try {
        const parsed = await parseOrderFactWorkbook(await f.arrayBuffer());
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

  const rows = useMemo(
    () => (plan && actuals ? computeDeviation(plan.parsed, actuals.parsed) : null),
    [plan, actuals],
  );

  const download = useCallback(async () => {
    if (!plan || !rows) return;
    setLoading('export');
    try {
      await exportDeviationXlsx(rows, plan.parsed.dates, deviationFileName(plan.parsed.dates));
    } catch (e) {
      fail(deviationFileName(plan.parsed.dates), e);
    } finally {
      setLoading(null);
    }
  }, [plan, rows, fail]);

  return { plan, actuals, loading, loadPlan, loadActuals, rows, download };
}
