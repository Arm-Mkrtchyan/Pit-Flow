import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Empty, Input, Segmented, Select, Space, Typography } from 'antd';
import VirtualList, { type ListRef } from 'rc-virtual-list';
import { t } from '../../shared/i18n/t';
import { useElementHeight } from '../../shared/ui/useElementHeight';
import { useAppStore } from '../../store';
import { BlockListItem } from './BlockListItem';
import {
  buildBlockViews,
  useBlockListView,
  type BlockFilters,
  type ClassFilter,
  type ListRow,
  type SortKey,
} from './useBlockListView';
import styles from './BlockList.module.css';

const VIRTUAL_ABOVE = 300;

/** `empty` replaces the default placeholder shown while no blocks are loaded. */
export function BlockList({ empty }: { empty?: ReactNode } = {}) {
  const blocks = useAppStore((s) => s.blocks);
  const inputs = useAppStore((s) => s.userInputs);
  const cutoff = useAppStore((s) => s.settings.oreCutoffEq);
  const openBlock = useAppStore((s) => s.openBlock);

  const [filters, setFilters] = useState<BlockFilters>({
    search: '',
    materials: [],
    cls: 'all',
    sort: 'id',
  });
  const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(new Set());
  const [active, setActive] = useState(0);

  const views = useMemo(() => buildBlockViews(blocks, inputs, cutoff), [blocks, inputs, cutoff]);
  const { rows, shown } = useBlockListView(views, filters, collapsed);
  const materials = useMemo(() => [...new Set(blocks.map((b) => b.material))].sort(), [blocks]);

  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<ListRef>(null);
  const height = useElementHeight(boxRef);
  const activeIndex = Math.min(active, Math.max(rows.length - 1, 0));

  const toggle = useCallback((elevation: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(elevation)) next.delete(elevation);
      else next.add(elevation);
      return next;
    });
  }, []);

  const activate = useCallback(
    (row: ListRow | undefined) => {
      if (!row) return;
      if (row.type === 'header') toggle(row.elevation);
      else openBlock(row.view.block.id);
    },
    [toggle, openBlock],
  );

  const onOpen = useCallback(
    (index: number) => {
      setActive(index);
      activate(rows[index]);
    },
    [rows, activate],
  );

  const focusIndex = (index: number) => {
    setActive(index);
    listRef.current?.scrollTo({ index, align: 'auto' });
    requestAnimationFrame(() =>
      boxRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.focus(),
    );
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = rows.length - 1;
    if (last < 0) return;
    const keyMap: Record<string, number> = {
      ArrowDown: Math.min(activeIndex + 1, last),
      ArrowUp: Math.max(activeIndex - 1, 0),
      Home: 0,
      End: last,
    };
    const target = keyMap[e.key];
    if (target !== undefined) {
      e.preventDefault();
      focusIndex(target);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate(rows[activeIndex]);
    }
  };

  const update = <K extends keyof BlockFilters>(key: K, value: BlockFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className={styles.root}>
      <Input.Search
        allowClear
        placeholder={t('blocks.search')}
        value={filters.search}
        onChange={(e) => update('search', e.target.value)}
        aria-label={t('blocks.search')}
      />
      <Space.Compact block>
        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder={t('blocks.materialFilter')}
          style={{ width: '55%' }}
          value={filters.materials}
          onChange={(v) => update('materials', v)}
          options={materials.map((m) => ({ value: m, label: m }))}
          aria-label={t('blocks.materialFilter')}
        />
        <Select<SortKey>
          style={{ width: '45%' }}
          value={filters.sort}
          onChange={(v) => update('sort', v)}
          aria-label={t('blocks.sort')}
          options={(['id', 'remaining', 'cu', 'mo', 'eq'] as const).map((k) => ({
            value: k,
            label: `${t('blocks.sort')}: ${t(`blocks.sort.${k}`)}`,
          }))}
        />
      </Space.Compact>
      <Segmented<ClassFilter>
        block
        size="small"
        value={filters.cls}
        onChange={(v) => update('cls', v)}
        options={[
          { value: 'all', label: t('class.all') },
          { value: 'ore', label: t('class.ore') },
          { value: 'waste', label: t('class.waste') },
        ]}
      />
      {blocks.length > 0 && (
        <Typography.Text type="secondary">
          {t('blocks.count', { shown, total: blocks.length })}
        </Typography.Text>
      )}

      <div
        ref={boxRef}
        className={styles.listBox}
        role="listbox"
        aria-label={t('blocks.listLabel')}
        onKeyDown={onKeyDown}
      >
        {blocks.length === 0 ? (
          (empty ?? <Empty description={t('blocks.empty')} />)
        ) : rows.length === 0 ? (
          <Empty description={t('blocks.noMatch')} />
        ) : (
          <VirtualList<ListRow>
            ref={listRef}
            data={rows}
            height={height}
            itemHeight={57}
            itemKey="key"
            virtual={shown > VIRTUAL_ABOVE}
          >
            {(row, index) =>
              row.type === 'header' ? (
                <div
                  role="option"
                  aria-selected={index === activeIndex}
                  aria-expanded={!row.collapsed}
                  tabIndex={index === activeIndex ? 0 : -1}
                  data-index={index}
                  className={styles.header}
                  onClick={() => onOpen(index)}
                >
                  <span>
                    {row.collapsed ? '▸' : '▾'}{' '}
                    {t('blocks.elevationGroup', { elevation: row.elevation })}
                  </span>
                  <Typography.Text type="secondary">{row.count}</Typography.Text>
                </div>
              ) : (
                <BlockListItem
                  view={row.view}
                  index={index}
                  active={index === activeIndex}
                  onOpen={onOpen}
                />
              )
            }
          </VirtualList>
        )}
      </div>
    </div>
  );
}
