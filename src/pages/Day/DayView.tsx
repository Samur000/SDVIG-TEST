import { useMemo, useRef, useState, useEffect, Fragment } from 'react';
import { Event } from '../../types';
import { isSameDay } from '../../utils/date';
import { 
  getEventsForDay, 
  getEventTop, 
  getEventHeight,
  groupConflictingEvents,
  formatTime,
  getCurrentTimePosition
} from './CalendarUtils';
import './DayView.css';

interface DayViewProps {
  date: Date;
  events: Event[];
  onEventClick?: (event: Event) => void;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayView({ date, events, onEventClick, onEventMove }: DayViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTimePos, setCurrentTimePos] = useState<number | null>(null);
  const isCurrentDay = isSameDay(date, new Date());
  
  // Обновление позиции текущего времени каждую минуту
  useEffect(() => {
    if (!isCurrentDay) {
      setCurrentTimePos(null);
      return;
    }
    
    const updateTime = () => {
      setCurrentTimePos(getCurrentTimePosition());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Каждую минуту
    
    return () => clearInterval(interval);
  }, [isCurrentDay]);
  
  const dayEvents = useMemo(() => getEventsForDay(events, date), [events, date]);
  const eventGroups = useMemo(() => groupConflictingEvents(dayEvents), [dayEvents]);
  
  // Скролл к текущему времени при загрузке (центрируем красную линию)
  useEffect(() => {
    if (isCurrentDay && containerRef.current && currentTimePos !== null) {
      // Высота видимой области контейнера
      const containerHeight = containerRef.current.clientHeight;
      // Прокручиваем так, чтобы красная линия была по середине
      const scrollPosition = currentTimePos - (containerHeight / 2);
      containerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [isCurrentDay]);
  
  // Обновление скролла при изменении позиции текущего времени (для центрирования)
  useEffect(() => {
    if (isCurrentDay && containerRef.current && currentTimePos !== null) {
      const containerHeight = containerRef.current.clientHeight;
      const currentScrollTop = containerRef.current.scrollTop;
      const visibleTop = currentScrollTop;
      const visibleBottom = currentScrollTop + containerHeight;
      
      // Если текущее время не в видимой области, центрируем его
      if (currentTimePos < visibleTop || currentTimePos > visibleBottom) {
        const scrollPosition = currentTimePos - (containerHeight / 2);
        containerRef.current.scrollTop = Math.max(0, scrollPosition);
      }
    }
  }, [currentTimePos, isCurrentDay]);
  
  return (
    <div className="day-view">
      <div className="day-view-hours">
        {HOURS.map(hour => (
          <div key={hour} className="day-view-hour">
            <span className="day-view-hour-label">{hour.toString().padStart(2, '0')}:00</span>
          </div>
        ))}
        {/* Метка на 24:00 */}
        <div className="day-view-hour">
          <span className="day-view-hour-label">00:00</span>
        </div>
      </div>
      
      <div 
        className="day-view-content" 
        ref={containerRef}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => {
          e.preventDefault();
          const eventId = e.dataTransfer.getData('eventId');
          const eventDuration = parseInt(e.dataTransfer.getData('duration'), 10);
          
          if (eventId && containerRef.current && onEventMove) {
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            const y = e.clientY - rect.top + container.scrollTop;
            
            // Вычисляем новое время на основе Y координаты (1 пиксель = 1 минута)
            const newMinutes = Math.max(0, Math.min(1440, Math.round(y)));
            const newStartTime = new Date(date);
            newStartTime.setHours(0, newMinutes, 0, 0);
            
            const newEndTime = new Date(newStartTime.getTime() + eventDuration);
            
            onEventMove(eventId, newStartTime, newEndTime);
          }
        }}
      >
        {/* Линия текущего времени */}
        {isCurrentDay && currentTimePos !== null && (
          <div 
            className="day-view-current-time"
            style={{ top: `${currentTimePos}px` }}
          >
            <div className="day-view-current-time-line" />
            <div className="day-view-current-time-dot" />
          </div>
        )}
        
        {/* Сетка часов */}
        <div className="day-view-grid">
          {HOURS.map(hour => (
            <Fragment key={hour}>
              {/* Основная линия часа */}
              <div className="day-view-grid-line-hour" style={{ top: `${hour * 60}px` }} />
              {/* Прерывистая линия на половине часа (30 минут) */}
              {hour < 23 && (
                <div 
                  className="day-view-grid-line-half" 
                  style={{ top: `${hour * 60 + 30}px` }} 
                />
              )}
            </Fragment>
          ))}
          {/* Линия на 24:00 (00:00 следующего дня) */}
          <div className="day-view-grid-line-hour" style={{ top: '1440px' }} />
        </div>
        
        {/* События */}
        <div className="day-view-events">
          {eventGroups.map((group) => {
            const groupWidth = 100 / group.length;
            return group.map((event, eventIndex) => {
              // Пропускаем события без startTime/endTime (старый формат)
              if (!event.startTime || !event.endTime) {
                return null;
              }
              
              const startTime = typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime;
              const endTime = typeof event.endTime === 'string' ? new Date(event.endTime) : event.endTime;
              
              // Проверяем валидность дат
              if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                return null;
              }
              
              const top = getEventTop(startTime);
              const height = getEventHeight(startTime, endTime);
              const left = (groupWidth * eventIndex);
              const width = groupWidth;
              const color = event.color || '#4285F4';
              
              // Вычисляем длительность события
              const duration = endTime.getTime() - startTime.getTime();
              
              // Обработчик начала перетаскивания
              const handleDragStart = (e: React.DragEvent) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('eventId', event.id);
                e.dataTransfer.setData('duration', duration.toString());
                (e.currentTarget as HTMLElement).style.opacity = '0.5';
              };
              
              // Обработчик окончания перетаскивания
              const handleDragEnd = (e: React.DragEvent) => {
                (e.currentTarget as HTMLElement).style.opacity = '1';
                // Помечаем, что только что было перетаскивание
                (e.currentTarget as HTMLElement).setAttribute('data-just-dragged', 'true');
                setTimeout(() => {
                  (e.currentTarget as HTMLElement).removeAttribute('data-just-dragged');
                }, 100);
              };
              
              // Обработчик перетаскивания над контейнером
              const handleDragOver = (e: React.DragEvent) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              };
              
              return (
                <div
                  key={event.id}
                  className="day-view-event"
                  draggable={!!onEventMove}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  style={{
                    top: `${top}px`,
                    left: `${left}%`,
                    width: `${width}%`,
                    height: `${height}px`,
                    borderLeftColor: color,
                    backgroundColor: color + '20',
                    cursor: onEventMove ? 'move' : 'pointer'
                  }}
                  onClick={(e) => {
                    // Предотвращаем клик сразу после drag
                    if ((e.target as HTMLElement).closest('.day-view-event')?.getAttribute('data-just-dragged') === 'true') {
                      e.preventDefault();
                      e.stopPropagation();
                      (e.target as HTMLElement).closest('.day-view-event')?.removeAttribute('data-just-dragged');
                      return;
                    }
                    onEventClick?.(event);
                  }}
                >
                  <div className="day-view-event-content">
                    <div className="day-view-event-title">{event.title}</div>
                    <div className="day-view-event-time">
                      {formatTime(startTime)} – {formatTime(endTime)}
                    </div>
                    {event.description && (
                      <div className="day-view-event-description">{event.description}</div>
                    )}
                  </div>
                </div>
              );
            }).filter(Boolean);
          })}
        </div>
      </div>
    </div>
  );
}

