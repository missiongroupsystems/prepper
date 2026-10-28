/** "3 Nov" — a tasting's day and month in the R&D history and follow ups. */
export function formatTastingDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
