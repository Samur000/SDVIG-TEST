import { Modal } from '../../components/Modal';
import { Checkbox } from '../../components/UI';
import { Event } from '../../types';
import { formatDateFull } from '../../utils/date';
import { formatTime } from './CalendarUtils';
import './EventDetailsModal.css';

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle?: () => void;
}

export function EventDetailsModal({ event, onClose, onEdit, onDelete, onToggle }: EventDetailsModalProps) {
  // Поддержка нового формата (startTime/endTime) и старого (date/time)
  let startTime: Date | undefined;
  let endTime: Date | undefined;
  let startTimeStr = '';
  let endTimeStr = '';
  let durationStr = '';
  let dateStr = '';
  
  if (event.startTime && event.endTime) {
    startTime = typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime;
    endTime = typeof event.endTime === 'string' ? new Date(event.endTime) : event.endTime;
    
    if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
      startTimeStr = formatTime(startTime);
      endTimeStr = formatTime(endTime);
      
      // Вычисляем длительность
      const duration = endTime.getTime() - startTime.getTime();
      const hours = Math.floor(duration / (1000 * 60 * 60));
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        durationStr = `${hours} ч`;
        if (minutes > 0) {
          durationStr += ` ${minutes} мин`;
        }
      } else {
        durationStr = `${minutes} мин`;
      }
      
      dateStr = formatDateFull(startTime);
    }
  } else if (event.date && event.time) {
    // Старый формат
    const eventDate = new Date(event.date + 'T' + event.time);
    if (!isNaN(eventDate.getTime())) {
      startTime = eventDate;
      dateStr = formatDateFull(startTime);
      startTimeStr = event.time;
      endTimeStr = '—';
      durationStr = '—';
    }
  }
  
  const color = event.color || '#4285F4';
  
  return (
    <Modal isOpen={true} onClose={onClose} title="Событие">
      <div className="event-details">
        {/* Цветная полоска */}
        <div 
          className="event-details-color-bar"
          style={{ backgroundColor: color }}
        />
        
        {/* Заголовок */}
        <div className="event-details-header">
          <div className="event-details-title-row">
            <h2 className={`event-details-title ${event.completed ? 'completed' : ''}`}>
              {event.title}
            </h2>
            {onToggle && (
              <Checkbox
                checked={event.completed}
                onChange={onToggle}
                size="md"
                color={color}
              />
            )}
          </div>
        </div>
        
        {/* Информация */}
        <div className="event-details-info">
          <div className="event-details-item">
            <div className="event-details-item-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Дата
            </div>
            <div className="event-details-item-value">{dateStr || '—'}</div>
          </div>
          
          <div className="event-details-item">
            <div className="event-details-item-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Время
            </div>
            <div className="event-details-item-value">
              {startTimeStr} – {endTimeStr} ({durationStr})
            </div>
          </div>
          
          {event.description && (
            <div className="event-details-item">
              <div className="event-details-item-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                Описание
              </div>
              <div className="event-details-item-value event-details-description">
                {event.description}
              </div>
            </div>
          )}
        </div>
        
        {/* Кнопки действий */}
        <div className="event-details-actions">
          <button 
            className="btn btn-primary filled"
            onClick={onEdit}
          >
            Редактировать
          </button>
          <button 
            className="btn text-danger"
            onClick={onDelete}
          >
            Удалить
          </button>
        </div>
      </div>
    </Modal>
  );
}

