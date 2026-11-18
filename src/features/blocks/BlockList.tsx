import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Alert, Button, Empty, Input, Segmented, Select, Space, Typography } from 'antd';
import VirtualList, { type ListRef } from 'rc-virtual-list';
import { t } from '../../shared/i18n/t';
import { useElementHeight } from '../../shared/ui/useElementHeight';
import { useAppStore } from '../../store';
import { BlockListItem, type DepMark } from './BlockListItem';
import { useDependencyEditor } from './useDependencyEditor';
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
  const setDepEditing = useAppStore((s) => s.setDepEditing);
  const dep = useDependencyEditor();
  const { on: depOn, pick: depPick } = dep;
  // Leaving the page (e.g. browser Back) must not leave the rest of the app disabled.
  useEffect(() => () => useAppStore.getState().setDepEditing(false), []);
  /** In dependency mode: the selected block and its current parents. */
  const depParents = useMemo(
    () => new Set(dep.child ? (inputs[dep.child]?.dependsOn ?? []) : []),
    [dep.child, inputs],
  );
  const markOf = (id: string): DepMark | undefined =>
    !dep.on ? undefined : id === dep.child ? 'selected' : depParents.has(id) ? 'parent' : undefined;

  const [filters, setFilters] = useState<BlockFilters>({
    search: '',
    materials: [],
    cls: 'all',
    sort: 'id',
  });
  const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(new Set());
  const [active, setActive] = useState(0);
  /** The current item is highlighted only while focus is in the list (not after leaving it). */
  const [listFocused, setListFocused] = useState(false);

  const views = useMemo(() => buildBlockViews(blocks, inputs, cutoff), [blocks, inputs, cutoff]);
  // Dependency mode hides the filters and shows every block; the filters return afterwards.
  const effectiveFilters = useMemo<BlockFilters>(
    () => (depOn ? { ...filters, search: '', materials: [], cls: 'all' } : filters),
    [depOn, filters],
  );
  const { rows, shown } = useBlockListView(views, effectiveFilters, collapsed);
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
      else if (depOn) depPick(row.view.block.id);
      else openBlock(row.view.block.id);
    },
    [toggle, openBlock, depOn, depPick],
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
      {!depOn && (
        <>
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
        </>
      )}
      {blocks.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography.Text type="secondary">
            {t('blocks.count', { shown, total: blocks.length })}
          </Typography.Text>
          <Button
            size="small"
            type={dep.on ? 'primary' : 'default'}
            aria-pressed={dep.on}
            onClick={() => setDepEditing(!dep.on)}
          >
            {dep.on ? t('blocks.dep.done') : t('blocks.dep.mode')}
          </Button>
        </div>
      )}
      {dep.on && (
        <Alert
          type="info"
          showIcon
          style={{ padding: '4px 8px', fontSize: 12 }}
          message={dep.child ? t('blocks.dep.selected', { id: dep.child }) : t('blocks.dep.hint')}
        />
      )}

      <div
        ref={boxRef}
        className={styles.listBox}
        role="listbox"
        aria-label={t('blocks.listLabel')}
        onKeyDown={onKeyDown}
        onFocus={() => setListFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setListFocused(false);
        }}
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
                  highlighted={index === activeIndex && listFocused && !depOn}
                  mark={markOf(row.view.block.id)}
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
