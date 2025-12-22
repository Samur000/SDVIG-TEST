import React, { useState } from 'react';
import { Event } from '../../types';
import { v4 as uuid } from 'uuid';
import './Forms.css';

interface EventFormProps {
  event: Event | null;
  defaultDate: string;
  onSave: (event: Event) => void;
  onCancel: () => void;
}

export function EventForm({ event, defaultDate, onSave, onCancel }: EventFormProps) {
  const [title, setTitle] = useState(event?.title || '');
  const [date, setDate] = useState(event?.date || defaultDate);
  const [time, setTime] = useState(event?.time || '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    
    onSave({
      id: event?.id || uuid(),
      title: title.trim(),
      date,
      time: time || undefined,
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
        <label className="form-label">Дата</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Время (опционально)</label>
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
        />
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Отмена
        </button>
        <button 
          type="submit" 
          className="btn btn-primary filled"
          disabled={!title.trim() || !date}
        >
          Сохранить
        </button>
      </div>
    </form>
  );
}

