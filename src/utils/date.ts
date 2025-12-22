import { DayOfWeek } from '../types';

const DAY_NAMES: DayOfWeek[] = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const DAY_NAMES_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const MONTH_NAMES = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

export function formatDate(date: Date): string {
  // Используем локальную дату, а не UTC
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

export function getToday(): string {
  return formatDate(new Date());
}

export function getDayOfWeek(date: Date): DayOfWeek {
  return DAY_NAMES[date.getDay()];
}

export function getDayName(date: Date): string {
  return DAY_NAMES_FULL[date.getDay()];
}

export function formatDateFull(date: Date): string {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year} г.`;
}

export function getWeekDates(baseDate: Date = new Date()): Date[] {
  const dates: Date[] = [];
  const current = new Date(baseDate);
  
  // Находим понедельник текущей недели
  const dayOfWeek = current.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  current.setDate(current.getDate() + diff);
  
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isThisWeek(dateStr: string): boolean {
  const date = parseDate(dateStr);
  const today = new Date();
  const startOfWeek = getStartOfWeek(today);
  const endOfWeek = addDays(startOfWeek, 7);
  return date >= startOfWeek && date < endOfWeek;
}

export function isThisMonth(dateStr: string): boolean {
  const date = parseDate(dateStr);
  const today = new Date();
  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function groupByDate<T extends { date: string }>(items: T[]): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const date = item.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function formatDateShort(dateStr: string): string {
  const date = parseDate(dateStr);
  const today = new Date();
  
  if (isToday(date)) return 'Сегодня';
  
  const yesterday = addDays(today, -1);
  if (isSameDay(date, yesterday)) return 'Вчера';
  
  const tomorrow = addDays(today, 1);
  if (isSameDay(date, tomorrow)) return 'Завтра';
  
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

// Получить даты месяца для календаря (с отступами для полных недель)
export function getMonthCalendarDates(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Находим понедельник первой недели (getDay: 0=вс, 1=пн, ..., 6=сб)
  // Преобразуем в 0=пн, 1=вт, ..., 6=вс
  let firstWeekday = firstDay.getDay();
  firstWeekday = firstWeekday === 0 ? 6 : firstWeekday - 1;
  
  // Стартовая дата - понедельник недели, содержащей 1-е число
  const startDate = new Date(year, month, 1 - firstWeekday);
  
  // Находим воскресенье последней недели
  let lastWeekday = lastDay.getDay();
  lastWeekday = lastWeekday === 0 ? 6 : lastWeekday - 1;
  
  // Конечная дата - воскресенье недели, содержащей последний день месяца
  const endDate = new Date(lastDay);
  endDate.setDate(lastDay.getDate() + (6 - lastWeekday));
  
  // Генерируем все даты (максимум 42 дня = 6 недель)
  const current = new Date(startDate);
  for (let i = 0; i < 42; i++) {
    if (current > endDate) break;
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Название месяца в именительном падеже
const MONTH_NAMES_NOM = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export function getMonthName(month: number): string {
  return MONTH_NAMES_NOM[month];
}

// Форматирование диапазона недели
export function formatWeekRange(dates: Date[]): string {
  if (dates.length === 0) return '';
  const start = dates[0];
  const end = dates[dates.length - 1];
  
  const startMonth = MONTH_NAMES[start.getMonth()];
  const endMonth = MONTH_NAMES[end.getMonth()];
  
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${startMonth}`;
  }
  return `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth}`;
}

// Проверка, принадлежит ли дата текущему месяцу
export function isSameMonth(date: Date, month: number, year: number): boolean {
  return date.getMonth() === month && date.getFullYear() === year;
}

