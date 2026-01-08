import { Event } from '../../types';
import { formatDate, isSameDay } from '../../utils/date';

// Получить события для определенного дня
export function getEventsForDay(events: Event[], date: Date): Event[] {
  const dateStr = formatDate(date);
  return events.filter(event => {
    // Новый формат с startTime
    if (event.startTime) {
      const startTime = typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime;
      return isSameDay(startTime, date);
    }
    // Старый формат с date (для совместимости)
    if (event.date) {
      return event.date === dateStr;
    }
    return false;
  }).sort((a, b) => {
    // Сортировка по времени начала
    if (a.startTime && b.startTime) {
      const aStart = typeof a.startTime === 'string' ? new Date(a.startTime) : a.startTime;
      const bStart = typeof b.startTime === 'string' ? new Date(b.startTime) : b.startTime;
      return aStart.getTime() - bStart.getTime();
    }
    // Для старых событий без времени
    return 0;
  });
}

// Получить события для недели
export function getEventsForWeek(events: Event[], weekDates: Date[]): Event[] {
  const startDate = new Date(weekDates[0]);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(weekDates[weekDates.length - 1]);
  endDate.setHours(23, 59, 59, 999);
  
  return events.filter(event => {
    // Новый формат с startTime
    if (event.startTime) {
      const startTime = typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime;
      if (isNaN(startTime.getTime())) return false;
      return startTime >= startDate && startTime <= endDate;
    }
    // Старый формат с date
    if (event.date) {
      const eventDate = new Date(event.date + 'T00:00:00');
      if (isNaN(eventDate.getTime())) return false;
      return eventDate >= startDate && eventDate <= endDate;
    }
    return false;
  });
}

// Получить позицию события в пикселях (top)
export function getEventTop(startTime: Date | string | undefined): number {
  if (!startTime) return 0;
  const time = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const hours = time.getHours();
  const minutes = time.getMinutes();
  return hours * 60 + minutes; // 1 час = 60px
}

// Получить высоту события в пикселях
export function getEventHeight(startTime: Date | string | undefined, endTime: Date | string | undefined): number {
  if (!startTime || !endTime) return 60; // По умолчанию 1 час
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 60;
  const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  return Math.max(30, diffMinutes); // Минимальная высота 30px (30 минут)
}

// Проверка пересечения двух событий
export function eventsOverlap(event1: Event, event2: Event): boolean {
  // Если у события нет startTime/endTime (старый формат), не считаем их пересекающимися
  if (!event1.startTime || !event1.endTime || !event2.startTime || !event2.endTime) {
    return false;
  }
  
  const start1 = typeof event1.startTime === 'string' ? new Date(event1.startTime) : event1.startTime;
  const end1 = typeof event1.endTime === 'string' ? new Date(event1.endTime) : event1.endTime;
  const start2 = typeof event2.startTime === 'string' ? new Date(event2.startTime) : event2.startTime;
  const end2 = typeof event2.endTime === 'string' ? new Date(event2.endTime) : event2.endTime;
  
  // Проверяем, что даты валидные
  if (isNaN(start1.getTime()) || isNaN(end1.getTime()) || isNaN(start2.getTime()) || isNaN(end2.getTime())) {
    return false;
  }
  
  return start1 < end2 && start2 < end1;
}

// Группировка событий по конфликтам (для отображения рядом друг с другом)
export function groupConflictingEvents(events: Event[]): Event[][] {
  const groups: Event[][] = [];
  const used = new Set<string>();
  
  for (const event of events) {
    if (used.has(event.id)) continue;
    
    const group = [event];
    used.add(event.id);
    
    // Находим все события, которые пересекаются с текущим
    for (const otherEvent of events) {
      if (used.has(otherEvent.id)) continue;
      if (eventsOverlap(event, otherEvent)) {
        group.push(otherEvent);
        used.add(otherEvent.id);
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}

// Форматирование времени для отображения
export function formatTime(date: Date | string | undefined): string {
  if (!date) return '00:00';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '00:00';
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Получить текущую позицию времени в пикселях
export function getCurrentTimePosition(): number | null {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return hours * 60 + minutes;
}

// Проверка, видимо ли текущее время на экране (для показа красной линии)
export function isCurrentTimeVisible(date: Date): boolean {
  const now = new Date();
  return isSameDay(now, date);
}

