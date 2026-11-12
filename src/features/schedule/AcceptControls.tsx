import { useMemo } from 'react';
import { App, Button, Popconfirm, Space, Tooltip } from 'antd';
import { t } from '../../shared/i18n/t';
import { fmtTonnes } from '../../shared/format';
import { useAppStore } from '../../store';
import { useIsStale } from './useIsStale';

/** Accept the current schedule (reduces remaining stock) and undo the last acceptance. */
export function AcceptControls() {
  const { message } = App.useApp();
  const schedule = useAppStore((s) => s.solution.schedule);
  const lastEntry = useAppStore((s) => s.history[0]);
  const accept = useAppStore((s) => s.acceptSchedule);
  const undo = useAppStore((s) => s.undoLastAcceptance);
  const stale = useIsStale();
  const isActuals = lastEntry?.kind === 'actuals';

  const totals = useMemo(() => {
    if (!schedule) return null;
    const ids = new Set<string>();
    let tonnes = 0;
    for (const d of schedule.days) {
      for (const a of d.allocations) {
        ids.add(a.blockId);
        tonnes += a.tonnes;
      }
    }
    return { blocks: ids.size, tonnes };
  }, [schedule]);

  const onAccept = () => {
    const r = accept();
    if (r.ok) void message.success(t('accept.done', { blocks: Object.keys(r.entry.taken).length }));
    else void message.error(t(`accept.error.${r.reason}`));
  };

  const onUndo = () => {
    const r = undo();
    if (r.ok) void message.success(t('undo.done'));
    else if (r.reason === 'missing')
      void message.error(t('undo.missing', { blocks: r.missing.join(', ') }));
  };

  return (
    <Space.Compact>
      {schedule && totals && (
        <Tooltip title={stale ? t('accept.staleHint') : undefined}>
          <Popconfirm
            title={t('accept.confirmTitle')}
            description={t('accept.confirm', {
              tonnes: fmtTonnes(totals.tonnes),
              blocks: totals.blocks,
            })}
            okText={t('accept.button')}
            cancelText={t('common.cancel')}
            onConfirm={onAccept}
            disabled={stale}
          >
            <Button size="small" type="primary" ghost disabled={stale}>
              {t('accept.button')}
            </Button>
          </Popconfirm>
        </Tooltip>
      )}
      {lastEntry && (
        <Popconfirm
          title={t(isActuals ? 'undo.confirmTitleActuals' : 'undo.confirmTitle')}
          description={t(isActuals ? 'undo.confirmActuals' : 'undo.confirm', {
            blocks: Object.keys(lastEntry.before).length,
            start: lastEntry.range[0],
            end: lastEntry.range[1],
          })}
          okText={t(isActuals ? 'undo.buttonActuals' : 'undo.button')}
          cancelText={t('common.cancel')}
          onConfirm={onUndo}
        >
          <Button size="small">{t(isActuals ? 'undo.buttonActuals' : 'undo.button')}</Button>
        </Popconfirm>
      )}
    </Space.Compact>
  );
}
