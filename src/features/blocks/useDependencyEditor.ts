import { useCallback, useEffect } from 'react';
import { App } from 'antd';
import { t } from '../../shared/i18n/t';
import { useAppStore } from '../../store';
import type { BlockId } from '../../types/domain';
import { formatChain } from './dependencyGraph';

/**
 * Dependency mode of the block list: the first block clicked is selected, the next one becomes
 * its parent (replacing the old one; clicking the current parent removes the dependency).
 * Esc clears the selection, a second Esc leaves the mode.
 */
export function useDependencyEditor() {
  const { message } = App.useApp();
  const on = useAppStore((s) => s.depEditing);
  const child = useAppStore((s) => s.depChild);

  useEffect(() => {
    if (!on) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const s = useAppStore.getState();
      if (s.depChild) s.setDepChild(null);
      else s.setDepEditing(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [on]);

  const pick = useCallback(
    (id: BlockId) => {
      const s = useAppStore.getState();
      const c = s.depChild;
      if (c === null) {
        s.setDepChild(id);
        return;
      }
      if (c === id) {
        s.setDepChild(null);
        return;
      }
      const current = s.userInputs[c]?.dependsOn ?? [];
      if (current.includes(id)) {
        s.setDependsOn(c, []);
        void message.info(t('blocks.dep.removed', { child: c, parent: id }));
        s.setDepChild(null);
        return;
      }
      const result = s.setDependsOn(c, [id]);
      if (!result.ok) {
        // Keep the block selected so another parent can be picked.
        void message.error(t('blockModal.cycle', { chain: formatChain(result.cycle) }));
        return;
      }
      void message.success(
        current.length > 0
          ? t('blocks.dep.replaced', { child: c, parent: id, old: current.join(', ') })
          : t('blocks.dep.set', { child: c, parent: id }),
      );
      s.setDepChild(null);
    },
    [message],
  );

  return { on, child, pick };
}
