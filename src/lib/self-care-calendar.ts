export const SELF_CARE_WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"] as const;

export type CalendarMonthMeta = {
  year: number;
  month: number;
};

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Lexicographic compare for `YYYY-MM-DD` keys (-1 past, 0 same, 1 future). */
export function compareDateKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

export function getCalendarMonthMeta(viewDate = new Date()): CalendarMonthMeta {
  return {
    year: viewDate.getFullYear(),
    month: viewDate.getMonth() + 1,
  };
}

export function isSameCalendarMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function addCalendarMonths(viewDate: Date, delta: number): Date {
  return new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
}

/** Seven columns × up to five rows (35 cells) for compact mobile layout. */
export function buildCalendarCells(viewDate = new Date()): Array<number | null> {
  const year = viewDate.getFullYear();
  const monthIndex = viewDate.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length < 35) cells.push(null);
  return cells.slice(0, 35);
}

export function getTodayGlowProgress(completedTaskCount: number): number {
  return Math.min(3, Math.max(0, completedTaskCount)) / 3;
}

export function getTodayCellViewportCenter(el: HTMLElement): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function isRealTodayInView(viewDate: Date, day: number, now = new Date()): boolean {
  return isSameCalendarMonth(viewDate, now) && day === now.getDate();
}
