export function money2(value: number | string | null | undefined): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function formatDate(value: string | Date): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function monthLabel(value: string | Date): string {
  return formatDate(value).slice(0, 7);
}

export function previousMonth(periodMonth: string): string {
  const [year, month] = periodMonth.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`;
}

export function lastDayOfPreviousMonth(periodMonth: string): string {
  const [year, month] = periodMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 0);
  return formatDate(date);
}

export function firstDayOfMonth(periodMonth: string): string {
  return `${periodMonth}-01`;
}
