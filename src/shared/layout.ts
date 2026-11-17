/**
 * Padding of the page content area, px (`.content` in app/AppLayout.module.css — keep in sync).
 * Sticky table headers use its negative as offset so they stick to the very top of the scroll
 * area instead of 16 px below it.
 */
export const CONTENT_PADDING = 16;

export const STICKY_HEADER = { offsetHeader: -CONTENT_PADDING } as const;
