import type { ReactNode } from 'react';
import { BlockList, BlockModal } from '../../features/blocks';
import { ImportButton, PasteBlocksTarget, PasteBlocksZone } from '../../features/import';
import { useAppStore } from '../../store';
import styles from '../AppLayout.module.css';

/** Shared block list (same data on every page); `extra` adds page-specific actions under the import. */
export function BlocksPanel({ extra }: { extra?: ReactNode }) {
  // While dependencies are edited the list starts at the top: no import actions.
  const depEditing = useAppStore((s) => s.depEditing);
  return (
    <div className={styles.leftPanel}>
      {!depEditing && (
        <>
          <ImportButton />
          {extra}
        </>
      )}
      <PasteBlocksTarget>
        <BlockList empty={<PasteBlocksZone />} />
      </PasteBlocksTarget>
      <BlockModal />
    </div>
  );
}
