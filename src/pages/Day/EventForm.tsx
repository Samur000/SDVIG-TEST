import React, { useState, useEffect } from 'react';
import { Event, EVENT_COLORS, EVENT_COLOR_DEFAULT } from '../../types';
import { v4 as uuid } from 'uuid';
import { formatDate } from '../../utils/date';
import './Forms.css';

interface EventFormProps {
  event: Event | null;
  defaultDate: string; // YYYY-MM-DD
  onSave: (event: Event) => void;
  onCancel: () => void;
}

export function EventForm({ event, defaultDate, onSave, onCancel }: EventFormProps) {
  // Для новых событий: начало - текущее время округленное до ближайших 30 минут, конец - +1 час
  const getDefaultStartTime = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? 30 : 60;
    now.setMinutes(roundedMinutes, 0, 0);
    if (roundedMinutes === 60) {
      now.setHours(now.getHours() + 1, 0, 0);
    }
    return now;
  };

  const getDefaultEndTime = (start: Date) => {
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    return end;
  };

  // Инициализация даты и времени
  const initializeDateTime = () => {
    if (event) {
      // Если событие уже существует, используем его дату и время
      const startTime = typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime;
      const endTime = typeof event.endTime === 'string' ? new Date(event.endTime) : event.endTime;
      return {
        date: formatDate(startTime),
        startTime: startTime,
        endTime: endTime
      };
    } else {
      // Для нового события
      const startDate = new Date(defaultDate + 'T09:00:00');
      if (!isNaN(startDate.getTime())) {
        const startTime = getDefaultStartTime();
        startTime.setFullYear(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endTime = getDefaultEndTime(startTime);
        return {
          date: defaultDate,
          startTime,
          endTime
        };
      } else {
        const startTime = getDefaultStartTime();
        const endTime = getDefaultEndTime(startTime);
        return {
          date: defaultDate,
          startTime,
          endTime
        };
      }
    }
  };

  const initialData = initializeDateTime();
  
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [date, setDate] = useState(initialData.date);
  const [startTime, setStartTime] = useState(initialData.startTime);
  const [endTime, setEndTime] = useState(initialData.endTime);
  const [color, setColor] = useState(event?.color || EVENT_COLOR_DEFAULT);
  const [timeError, setTimeError] = useState('');

  // Обновление времени при изменении даты
  useEffect(() => {
    if (date) {
      const newDate = new Date(date + 'T00:00:00');
      if (!isNaN(newDate.getTime())) {
        const currentStart = new Date(startTime);
        currentStart.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
        const currentEnd = new Date(endTime);
        currentEnd.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
        setStartTime(currentStart);
        setEndTime(currentEnd);
      }
    }
  }, [date]);

  // Валидация времени
  useEffect(() => {
    if (startTime >= endTime) {
      setTimeError('Конец должен быть позже начала');
    } else {
      const diffMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      if (diffMinutes < 30) {
        setTimeError('Минимальная длительность события — 30 минут');
      } else {
        setTimeError('');
      }
    }
  }, [startTime, endTime]);

  const formatTimeInput = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleStartTimeChange = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newStartTime = new Date(startTime);
    newStartTime.setHours(hours, minutes, 0, 0);
    setStartTime(newStartTime);
    
    // Если новое начало позже конца или меньше 30 минут до конца, автоматически обновляем конец
    const diffMinutes = (endTime.getTime() - newStartTime.getTime()) / (1000 * 60);
    if (newStartTime >= endTime || diffMinutes < 30) {
      const newEndTime = new Date(newStartTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + 30); // Минимум 30 минут
      setEndTime(newEndTime);
    }
  };

  const handleEndTimeChange = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newEndTime = new Date(endTime);
    newEndTime.setHours(hours, minutes, 0, 0);
    
    // Проверка: минимальная длительность 30 минут
    const diffMinutes = (newEndTime.getTime() - startTime.getTime()) / (1000 * 60);
    if (diffMinutes < 30) {
      // Автоматически увеличиваем время конца на 30 минут от начала
      const minEndTime = new Date(startTime);
      minEndTime.setMinutes(minEndTime.getMinutes() + 30);
      setEndTime(minEndTime);
      setTimeError('Минимальная длительность события — 30 минут');
      // Убираем ошибку через 2 секунды
      setTimeout(() => setTimeError(''), 2000);
    } else {
      setEndTime(newEndTime);
      setTimeError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    if (startTime >= endTime) return;
    
    onSave({
      id: event?.id || uuid(),
      title: title.trim(),
      description: description.trim() || undefined,
      startTime,
      endTime,
      color,
      completed: event?.completed || false
    });
  };
  
  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Название</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Например: Встреча с врачом"
          required
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Описание (опционально)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Добавьте описание события..."
          rows={3}
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Дата</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>
      
      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Начало</label>
          <input
            type="time"
            value={formatTimeInput(startTime)}
            onChange={e => handleStartTimeChange(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Конец</label>
          <input
            type="time"
            value={formatTimeInput(endTime)}
            onChange={e => handleEndTimeChange(e.target.value)}
            required
          />
        </div>
      </div>
      
      {timeError && (
        <div className="form-error" style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '-8px', marginBottom: '8px' }}>
          {timeError}
        </div>
      )}
      
      <div className="form-group">
        <label className="form-label">Цвет</label>
        <div className="color-picker" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {EVENT_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className="color-option"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: c,
                border: color === c ? '3px solid var(--text)' : '2px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setColor(c)}
              title={c}
            />
          ))}
        </div>
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Отмена
        </button>
        <button 
          type="submit" 
          className="btn btn-primary filled"
          disabled={!title.trim() || !date || startTime >= endTime || ((endTime.getTime() - startTime.getTime()) / (1000 * 60)) < 30}
        >
          Сохранить
        </button>
      </div>
    </form>
  );
}
