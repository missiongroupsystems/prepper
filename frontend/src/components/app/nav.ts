/**
 * Navigation model for the app shell — the rail, the phone menu sheet and the top bar's
 * crumbs all read from here, so a destination is declared once.
 *
 * Grouped under Workforce's uppercase section eyebrows (styleguide §7.3). Groups must be
 * contiguous. Hiding an item here is presentation only: pages and the API enforce access.
 */
import {
  BookOpen,
  ChartColumn,
  FlaskConical,
  Package,
  Settings,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: string;
  /** Rendered only for admins. Presentation only. */
  adminOnly?: boolean;
  /**
   * Other route trees reached from this item (a tab, a list row), so the item stays lit there.
   * Matched by path segment: `/menu` never lights `/menu-sketch` by accident.
   */
  matchPrefixes?: string[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Menu', href: '/menu', icon: UtensilsCrossed, group: 'Kitchen', matchPrefixes: ['/menu-sketch'] },
  { label: 'Dishes', href: '/recipes', icon: BookOpen, group: 'Kitchen', matchPrefixes: ['/recipe-categories'] },
  // Suppliers is a tab of the Ingredients page; its detail route lives at /suppliers/[id].
  { label: 'Ingredients', href: '/ingredients', icon: Package, group: 'Kitchen', matchPrefixes: ['/suppliers'] },
  // Tastings are started from R&D and from a dish's Overview.
  { label: 'R&D', href: '/rnd', icon: FlaskConical, group: 'Kitchen', matchPrefixes: ['/tastings'] },
  { label: 'Reports', href: '/finance', icon: ChartColumn, group: 'Insights' },
  // Outlets and Design are tabs of Settings.
  { label: 'Settings', href: '/settings', icon: Settings, group: 'Workspace', matchPrefixes: ['/outlets', '/design-system'] },
];

/** Where the wordmark and an unknown route lead. Mirrors AuthGuard's default route. */
export const HOME_HREF = '/recipes';

export function navForUser(userType: 'normal' | 'admin' | null): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || userType === 'admin');
}

function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return [item.href, ...(item.matchPrefixes ?? [])].some((prefix) => isUnder(pathname, prefix));
}

/** The nav cut into its groups, in order — for the phone sheet, which divides groups with a hairline. */
export function groupNav(items: readonly NavItem[]): NavItem[][] {
  const groups: NavItem[][] = [];
  items.forEach((item, i) => {
    if (i === 0 || item.group !== items[i - 1]?.group) groups.push([item]);
    else groups[groups.length - 1]?.push(item);
  });
  return groups;
}

/**
 * The page under a section, for the crumb after it. Detail routes are named by kind, not by
 * record: the bar must not fetch to label itself, and the page's own header names the record.
 */
const LEAF_LABELS: ReadonlyArray<readonly [pattern: RegExp, label: string]> = [
  [/^\/recipes\/new$/, 'New dish'],
  [/^\/recipes\/[^/]+$/, 'Dish'],
  [/^\/recipe-categories\/[^/]+$/, 'Category'],
  [/^\/ingredients\/[^/]+$/, 'Ingredient'],
  [/^\/suppliers$/, 'Suppliers'],
  [/^\/suppliers\/[^/]+$/, 'Supplier'],
  [/^\/menu\/new$/, 'New menu'],
  [/^\/menu\/edit\/[^/]+$/, 'Edit menu'],
  [/^\/menu\/preview\/[^/]+$/, 'Preview'],
  [/^\/menu-sketch$/, 'Menu sketches'],
  [/^\/menu-sketch\/[^/]+$/, 'Menu sketch'],
  [/^\/rnd\/r\/[^/]+$/, 'Dish'],
  [/^\/tastings\/new$/, 'New tasting'],
  [/^\/tastings$/, 'Tastings'],
  [/^\/tastings\/[^/]+$/, 'Tasting'],
  [/^\/tastings\/[^/]+\/[ri]\/[^/]+$/, 'Tasting notes'],
  [/^\/outlets$/, 'Outlets'],
  [/^\/outlets\/[^/]+$/, 'Outlet'],
  [/^\/design-system$/, 'Design'],
];

export interface Crumbs {
  section: NavItem | undefined;
  leaf: string | undefined;
}

export function crumbsFor(items: readonly NavItem[], pathname: string): Crumbs {
  const section = items.find((item) => isNavItemActive(item, pathname));
  const leaf = LEAF_LABELS.find(([pattern]) => pattern.test(pathname))?.[1];
  return { section, leaf };
}
