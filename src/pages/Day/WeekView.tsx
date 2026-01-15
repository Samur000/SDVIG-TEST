import { useMemo, useRef, useState, useEffect, Fragment } from 'react';
import { Event } from '../../types';
import { formatDate, getWeekDates, isSameDay } from '../../utils/date';
import { 
  getEventsForWeek, 
  getEventTop, 
  getEventHeight,
  groupConflictingEvents,
  formatTime,
  getCurrentTimePosition
} from './CalendarUtils';
import './WeekView.css';

interface WeekViewProps {
  date: Date;
  events: Event[];
  onEventClick?: (event: Event) => void;
  onDateClick?: (date: Date) => void;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function WeekView({ date, events, onEventClick, onDateClick, onEventMove, onDragStart, onDragEnd }: WeekViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTimePos, setCurrentTimePos] = useState<number | null>(null);
  const [draggingEvent, setDraggingEvent] = useState<{ id: string; startY: number; startX: number; duration: number; dayIndex: number; currentY: number; currentX: number; offsetY: number; offsetX: number; startTime: number; hasMoved: boolean } | null>(null);
  
  const weekDates = useMemo(() => getWeekDates(date), [date]);
  
  // Обновление позиции текущего времени
  useEffect(() => {
    const updateTime = () => {
      setCurrentTimePos(getCurrentTimePosition());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const weekEvents = useMemo(() => getEventsForWeek(events, weekDates), [events, weekDates]);
  
  // Группировка событий по дням
  const eventsByDay = useMemo(() => {
    const groups: Record<string, Event[]> = {};
    weekDates.forEach(date => {
      const dateStr = formatDate(date);
      groups[dateStr] = weekEvents.filter(event => {
        // Новый формат с startTime
        if (event.startTime) {
          const startTime = typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime;
          if (isNaN(startTime.getTime())) return false;
          return isSameDay(startTime, date);
        }
        // Старый формат с date (для совместимости)
        if (event.date) {
          return event.date === dateStr;
        }
        return false;
      }).filter(event => {
        // Фильтруем только события с валидными startTime/endTime для отображения на временной шкале
        if (event.startTime && event.endTime) {
          const startTime = typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime;
          const endTime = typeof event.endTime === 'string' ? new Date(event.endTime) : event.endTime;
          return !isNaN(startTime.getTime()) && !isNaN(endTime.getTime());
        }
        return false; // Старые события без времени не показываем на временной шкале
      });
    });
    return groups;
  }, [weekEvents, weekDates]);
  
  const today = new Date();
  const isCurrentWeek = weekDates.some(day => isSameDay(day, today));
  
  // Скролл к текущему времени при загрузке (центрируем красную линию)
  useEffect(() => {
    if (isCurrentWeek && containerRef.current && currentTimePos !== null) {
      // Высота видимой области контейнера
      const containerHeight = containerRef.current.clientHeight;
      // Прокручиваем так, чтобы красная линия была по середине
      const scrollPosition = currentTimePos - (containerHeight / 2);
      containerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [isCurrentWeek]);
  
  // Обновление скролла при изменении позиции текущего времени (для центрирования)
  useEffect(() => {
    if (isCurrentWeek && containerRef.current && currentTimePos !== null) {
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
  }, [currentTimePos, isCurrentWeek]);
  
  return (
    <div className="week-view">
      {/* Шапка с днями недели */}
      <div className="week-view-header">
        <div className="week-view-header-days">
          {weekDates.map((day, index) => {
            const isCurrentDay = isSameDay(day, today);
            const dayLabel = DAY_LABELS[index];
            return (
              <div 
                key={formatDate(day)} 
                className={`week-view-header-day ${isCurrentDay ? 'current' : ''}`}
                onClick={() => onDateClick?.(day)}
              >
                <span className="week-view-header-day-label">{dayLabel}</span>
                <span className={`week-view-header-day-number ${isCurrentDay ? 'current' : ''}`}>
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="week-view-body">
        {/* Колонка с часами */}
        <div className="week-view-hours">
          {HOURS.map(hour => (
            <div key={hour} className="week-view-hour">
              <span className="week-view-hour-label">{hour.toString().padStart(2, '0')}:00</span>
            </div>
          ))}
          {/* Метка на 24:00 */}
          <div className="week-view-hour">
            <span className="week-view-hour-label">00:00</span>
          </div>
        </div>
        
        {/* Область контента */}
        <div 
          className="week-view-content" 
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
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top + container.scrollTop;
              
              // Определяем день недели на основе X координаты
              const containerWidth = rect.width;
              const dayWidth = containerWidth / 7;
              const dayIndex = Math.max(0, Math.min(6, Math.floor(x / dayWidth)));
              const targetDay = weekDates[dayIndex];
              
              // Вычисляем новое время на основе Y координаты (1 пиксель = 1 минута)
              const newMinutes = Math.max(0, Math.min(1440, Math.round(y)));
              const newStartTime = new Date(targetDay);
              newStartTime.setHours(0, newMinutes, 0, 0);
              
              const newEndTime = new Date(newStartTime.getTime() + eventDuration);
              
              onEventMove(eventId, newStartTime, newEndTime);
            }
          }}
          onTouchMove={(e) => {
            // Обновляем позицию перетаскиваемого события
            if (draggingEvent && containerRef.current) {
              const touch = e.touches[0];
              const container = containerRef.current;
              const rect = container.getBoundingClientRect();
              const x = touch.clientX - rect.left;
              const y = touch.clientY - rect.top + container.scrollTop;
              setDraggingEvent({
                ...draggingEvent,
                currentY: y,
                currentX: x
              });
              e.preventDefault();
            }
          }}
        >
          {/* Линия текущего времени */}
          {currentTimePos !== null && isCurrentWeek && (
            <div 
              className="week-view-current-time"
              style={{ top: `${currentTimePos}px` }}
            >
              <div className="week-view-current-time-line" />
              <div className="week-view-current-time-dot" />
            </div>
          )}
          
          {/* Вертикальные линии-разделители дней */}
          {weekDates.slice(1).map((day, index) => {
            const left = ((index + 1) / 7) * 100;
            return (
              <div
                key={`divider-${formatDate(day)}`}
                className="week-view-day-divider"
                style={{ left: `${left}%` }}
              />
            );
          })}
          
          {/* Сетка */}
          <div className="week-view-grid">
            {HOURS.map(hour => (
              <Fragment key={hour}>
                {/* Основная линия часа */}
                <div 
                  className="week-view-grid-row-hour" 
                  style={{ top: `${hour * 60}px` }}
                >
                  {weekDates.map((day) => (
                    <div key={formatDate(day)} className="week-view-grid-cell" />
                  ))}
                </div>
                {/* Прерывистая линия на половине часа (30 минут) */}
                {hour < 23 && (
                  <div 
                    className="week-view-grid-row-half" 
                    style={{ top: `${hour * 60 + 30}px` }}
                  >
                    {weekDates.map((day) => (
                      <div key={formatDate(day)} className="week-view-grid-cell-half" />
                    ))}
                  </div>
                )}
              </Fragment>
            ))}
            {/* Линия на 24:00 */}
            <div 
              className="week-view-grid-row-hour" 
              style={{ top: '1440px' }}
            >
              {weekDates.map((day) => (
                <div key={formatDate(day)} className="week-view-grid-cell" />
              ))}
            </div>
          </div>
          
          {/* События */}
          <div className="week-view-events">
            {weekDates.flatMap((day, dayIndex) => {
              const dateStr = formatDate(day);
              const dayEvents = eventsByDay[dateStr] || [];
              const eventGroups = groupConflictingEvents(dayEvents);
              const dayLeft = (100 / 7) * dayIndex;
              
              return eventGroups.flatMap((group) => {
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
                      const eventLeftInGroup = (groupWidth * eventIndex);
                      const eventWidth = groupWidth;
                      const color = event.color || '#4285F4';
                      
                      // Определяем день события
                      const eventDayIndex = weekDates.findIndex(d => isSameDay(d, startTime));
                      
                      // Вычисляем абсолютную позицию левого края события в процентах от контейнера
                      const dayWidthPercent = 100 / 7;
                      const eventLeft = dayLeft + (eventLeftInGroup / 100) * dayWidthPercent;
                      
                      // Вычисляем длительность события
                      const duration = endTime.getTime() - startTime.getTime();
                      const isDragging = draggingEvent?.id === event.id;
                      
                      // Вычисляем позицию для визуального отображения при перетаскивании
                      // Точка соприкосновения (палец) остается в том же месте относительно элемента
                      let displayTop = top;
                      let displayLeft = eventLeft;
                      if (isDragging && draggingEvent) {
                        // Вычисляем позицию верхнего края элемента: позиция пальца минус смещение
                        displayTop = Math.max(0, Math.min(1440 - height, draggingEvent.currentY - draggingEvent.offsetY));
                        // Определяем новый день на основе X координаты с учетом смещения
                        if (containerRef.current) {
                          const containerWidth = containerRef.current.getBoundingClientRect().width;
                          const dayWidth = containerWidth / 7;
                          // Вычисляем позицию левого края элемента: позиция пальца минус смещение
                          const eventLeftPx = draggingEvent.currentX - draggingEvent.offsetX;
                          const newDayIndex = Math.max(0, Math.min(6, Math.floor(eventLeftPx / dayWidth)));
                          // Сохраняем позицию внутри группы при перемещении между днями
                          displayLeft = (100 / 7) * newDayIndex + (eventLeftInGroup / 100) * dayWidthPercent;
                        }
                      }
                      
                      // Обработчик начала перетаскивания (desktop)
                      const handleDragStart = (e: React.DragEvent) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('eventId', event.id);
                        e.dataTransfer.setData('duration', duration.toString());
                        (e.currentTarget as HTMLElement).style.opacity = '0.5';
                      };
                      
                      // Обработчик окончания перетаскивания (desktop)
                      const handleDragEnd = (e: React.DragEvent) => {
                        (e.currentTarget as HTMLElement).style.opacity = '1';
                        // Помечаем, что только что было перетаскивание
                        (e.currentTarget as HTMLElement).setAttribute('data-just-dragged', 'true');
                        setTimeout(() => {
                          (e.currentTarget as HTMLElement).removeAttribute('data-just-dragged');
                        }, 100);
                      };
                      
                      // Обработчики для touch (мобильные устройства)
                      const handleTouchStart = (e: React.TouchEvent) => {
                        if (!onEventMove || !containerRef.current) return;
                        const touch = e.touches[0];
                        const container = containerRef.current;
                        const rect = container.getBoundingClientRect();
                        const touchX = touch.clientX - rect.left;
                        const touchY = touch.clientY - rect.top + container.scrollTop;
                        // Вычисляем смещение: насколько палец находится ниже/правее верхнего/левого края элемента
                        const offsetY = touchY - top;
                        // Вычисляем абсолютную позицию левого края события в пикселях относительно контейнера
                        const containerWidth = container.getBoundingClientRect().width;
                        const eventLeftPx = (eventLeft / 100) * containerWidth;
                        const offsetX = touchX - eventLeftPx;
                        setDraggingEvent({
                          id: event.id,
                          startY: top,
                          startX: touchX,
                          duration: duration,
                          dayIndex: eventDayIndex,
                          currentY: touchY,
                          currentX: touchX,
                          offsetY: offsetY,
                          offsetX: offsetX,
                          startTime: Date.now(),
                          hasMoved: false
                        });
                        // Отключаем свайп недели при начале перетаскивания
                        onDragStart?.();
                        e.stopPropagation();
                      };
                      
                      const handleTouchMove = (e: React.TouchEvent) => {
                        if (!draggingEvent || draggingEvent.id !== event.id || !containerRef.current) return;
                        const touch = e.touches[0];
                        const container = containerRef.current;
                        const rect = container.getBoundingClientRect();
                        const touchX = touch.clientX - rect.left;
                        const touchY = touch.clientY - rect.top + container.scrollTop;
                        // Проверяем, было ли движение (больше 5 пикселей)
                        const moved = Math.abs(touchX - draggingEvent.startX) > 5 || Math.abs(touchY - draggingEvent.startY) > 5;
                        setDraggingEvent({
                          ...draggingEvent,
                          currentY: touchY,
                          currentX: touchX,
                          hasMoved: draggingEvent.hasMoved || moved
                        });
                        e.stopPropagation();
                      };
                      
                      const handleTouchEnd = (e: React.TouchEvent) => {
                        const wasDragging = draggingEvent && draggingEvent.id === event.id;
                        
                        if (!wasDragging) {
                          // Если не было перетаскивания - это клик
                          setDraggingEvent(null);
                          onDragEnd?.();
                          if (onEventClick) {
                            onEventClick(event);
                          }
                          return;
                        }
                        
                        if (!containerRef.current || !onEventMove) {
                          setDraggingEvent(null);
                          onDragEnd?.();
                          return;
                        }
                        
                        // Проверяем, было ли движение или длительное удержание
                        const dragDuration = Date.now() - draggingEvent.startTime;
                        const hasMoved = draggingEvent.hasMoved;
                        const wasDrag = hasMoved || dragDuration > 300;
                        
                        if (wasDrag) {
                          // Это было перетаскивание
                          const touch = e.changedTouches[0];
                          const container = containerRef.current;
                          const rect = container.getBoundingClientRect();
                          const touchX = touch.clientX - rect.left;
                          const touchY = touch.clientY - rect.top + container.scrollTop;
                          
                          // Вычисляем позицию верхнего края элемента: позиция пальца минус смещение
                          const newTop = touchY - draggingEvent.offsetY;
                          
                          // Определяем день недели на основе X координаты с учетом смещения
                          const containerWidth = rect.width;
                          const dayWidth = containerWidth / 7;
                          // Вычисляем позицию левого края элемента: позиция пальца минус смещение
                          const eventLeftPx = touchX - draggingEvent.offsetX;
                          const newDayIndex = Math.max(0, Math.min(6, Math.floor(eventLeftPx / dayWidth)));
                          const targetDay = weekDates[newDayIndex];
                          
                          // Вычисляем новое время на основе верхнего края элемента (1 пиксель = 1 минута)
                          const newMinutes = Math.max(0, Math.min(1440, Math.round(newTop)));
                          const newStartTime = new Date(targetDay);
                          newStartTime.setHours(0, newMinutes, 0, 0);
                          
                          const newEndTime = new Date(newStartTime.getTime() + draggingEvent.duration);
                          
                          onEventMove(event.id, newStartTime, newEndTime);
                          
                          // Помечаем, что только что было перетаскивание
                          const eventElement = e.currentTarget as HTMLElement;
                          eventElement.setAttribute('data-just-dragged', 'true');
                          setTimeout(() => {
                            eventElement.removeAttribute('data-just-dragged');
                          }, 500);
                          
                          setDraggingEvent(null);
                          onDragEnd?.();
                        } else {
                          // Если не было движения - это клик
                          setDraggingEvent(null);
                          onDragEnd?.();
                          if (onEventClick) {
                            onEventClick(event);
                          }
                        }
                        
                        e.stopPropagation();
                      };
                      
                      return (
                        <div
                          key={event.id}
                          className="week-view-event"
                          draggable={!!onEventMove}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          style={{
                            top: `${displayTop}px`,
                            left: `${displayLeft}%`,
                            width: `${(eventWidth / 100) * dayWidthPercent}%`,
                            height: `${height}px`,
                            borderLeftColor: color,
                            backgroundColor: color + '20',
                            cursor: onEventMove ? 'move' : 'pointer',
                            opacity: isDragging ? 0.5 : 1,
                            touchAction: 'none',
                            zIndex: isDragging ? 1000 : 'auto',
                            userSelect: isDragging ? 'none' : 'auto',
                            WebkitUserSelect: isDragging ? 'none' : 'auto'
                          }}
                          onClick={(e) => {
                            // Предотвращаем клик сразу после drag
                            if ((e.target as HTMLElement).closest('.week-view-event')?.getAttribute('data-just-dragged') === 'true') {
                              e.preventDefault();
                              e.stopPropagation();
                              (e.target as HTMLElement).closest('.week-view-event')?.removeAttribute('data-just-dragged');
                              return;
                            }
                            onEventClick?.(event);
                          }}
                        >
                          <div className="week-view-event-content">
                            <div className="week-view-event-title">{event.title}</div>
                            <div className="week-view-event-time">
                              {formatTime(startTime)}
                            </div>
                          </div>
                        </div>
                      );
                    }).filter(Boolean);
                  });
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

