/**
 * Where a portalled Menu sits on screen, from its trigger's rectangle. The caller's `side` is a
 * preference: a menu that would run off the bottom opens upward when there is more room above.
 * Pure, so the flip and the clamp need no browser.
 */

/** Space between the trigger and the menu. */
export const MENU_GAP_PX = 4;
/** The menu never touches the screen edge. */
export const MENU_VIEWPORT_MARGIN_PX = 8;

export interface Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Exactly one of `top`/`bottom` and one of `left`/`right` is set — `position: fixed` offsets. */
export interface MenuPlacement {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export function placeMenu({
  trigger,
  menu,
  viewport,
  side,
  align,
}: {
  trigger: Rect;
  /** The menu's rendered size; `null` before its first measure (then the preferred side wins). */
  menu: { width: number; height: number } | null;
  viewport: { width: number; height: number };
  side: 'bottom' | 'top';
  align: 'start' | 'end';
}): MenuPlacement {
  const roomBelow = viewport.height - trigger.bottom - MENU_GAP_PX - MENU_VIEWPORT_MARGIN_PX;
  const roomAbove = trigger.top - MENU_GAP_PX - MENU_VIEWPORT_MARGIN_PX;
  const height = menu?.height ?? 0;
  const opensUp =
    side === 'top' ? !(roomAbove < height && roomBelow > roomAbove) : roomBelow < height && roomAbove > roomBelow;

  const width = menu?.width ?? 0;
  const maxLeft = viewport.width - width - MENU_VIEWPORT_MARGIN_PX;
  const horizontal: MenuPlacement =
    align === 'end'
      ? { right: Math.max(MENU_VIEWPORT_MARGIN_PX, viewport.width - trigger.right) }
      : { left: Math.max(MENU_VIEWPORT_MARGIN_PX, Math.min(trigger.left, maxLeft)) };

  return opensUp
    ? { ...horizontal, bottom: viewport.height - trigger.top + MENU_GAP_PX }
    : { ...horizontal, top: trigger.bottom + MENU_GAP_PX };
}
