import type { ReactNode } from 'react';
import { BlockList, BlockModal } from '../../features/blocks';
import { ImportButton, PasteBlocksTarget, PasteBlocksZone } from '../../features/import';
import styles from '../AppLayout.module.css';

/** Shared block list (same data on every page); `extra` adds page-specific actions under the import. */
export function BlocksPanel({ extra }: { extra?: ReactNode }) {
  return (
    <div className={styles.leftPanel}>
      <ImportButton />
      {extra}
      <PasteBlocksTarget>
        <BlockList empty={<PasteBlocksZone />} />
      </PasteBlocksTarget>
      <BlockModal />
    </div>
  );
}
