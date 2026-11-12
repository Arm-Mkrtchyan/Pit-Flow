import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Space, Tag, Tooltip, Typography } from 'antd';
import { t } from '../../shared/i18n/t';
import { fmtTonnes } from '../../shared/format';
import { useAppStore } from '../../store';
import type { ScheduleStatus } from '../../types/domain';
import { useSolve, type SolveProgress } from './useSolve';
import { warningText } from './warnings';

const STATUS_COLOR: Record<ScheduleStatus, string> = {
  optimal: 'green',
  time_limit: 'gold',
  rolling_horizon: 'blue',
  error: 'red',
};

function useElapsed(progress: SolveProgress | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!progress) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [progress]);
  return progress ? Math.max(now - progress.startedAt, 0) / 1000 : 0;
}

function phaseText(p: SolveProgress): string {
  return p.phase === 'rolling'
    ? t('solve.phase.rolling', { day: p.day ?? 0, days: p.days ?? 0 })
    : t(`solve.phase.${p.phase}`);
}

export function SolveToolbar() {
  const hasBlocks = useAppStore((s) => s.blocks.length > 0);
  const hasRange = useAppStore((s) => s.plan.range !== null);
  const { schedule, stale, warnings } = useAppStore((s) => s.solution);
  const { solve, cancel, progress } = useSolve();
  const elapsed = useElapsed(progress);

  const summary = useMemo(() => {
    if (!schedule) return null;
    let ore = 0;
    let waste = 0;
    const used = new Set<string>();
    for (const d of schedule.days) {
      for (const a of d.allocations) {
        if (a.cls === 'ore') ore += a.tonnes;
        else waste += a.tonnes;
        used.add(a.blockId);
      }
    }
    return { ore, waste, blocks: used.size };
  }, [schedule]);

  const disabledReason = !hasBlocks
    ? t('solve.needBlocks')
    : !hasRange
      ? t('solve.needRange')
      : null;

  return (
    <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }}>
      <Space wrap>
        <Tooltip title={disabledReason}>
          <Button
            type="primary"
            onClick={() => void solve()}
            loading={progress !== null}
            disabled={disabledReason !== null}
          >
            {t('solve.calculate')}
          </Button>
        </Tooltip>
        {progress && (
          <>
            <Typography.Text>{phaseText(progress)}</Typography.Text>
            <Typography.Text type="secondary">
              {t('solve.elapsed', { seconds: elapsed.toFixed(1) })}
            </Typography.Text>
            <Button danger size="small" onClick={cancel}>
              {t('solve.cancel')}
            </Button>
          </>
        )}
        {!progress && schedule && (
          <>
            <Tag color={STATUS_COLOR[schedule.status]}>{t(`solve.status.${schedule.status}`)}</Tag>
            {stale && <Tag color="orange">{t('solve.stale')}</Tag>}
            {summary && (
              <Typography.Text type="secondary">
                {t('solve.summary', {
                  ore: fmtTonnes(summary.ore),
                  waste: fmtTonnes(summary.waste),
                  blocks: summary.blocks,
                })}
              </Typography.Text>
            )}
          </>
        )}
      </Space>
      {!progress &&
        warnings.map((w) => (
          <Alert key={w.code} type="warning" showIcon message={warningText(w)} />
        ))}
    </Space>
  );
}
