import React, { useState } from 'react';
import { Routine, DayOfWeek } from '../../types';
import { v4 as uuid } from 'uuid';
import './Forms.css';

interface RoutineFormProps {
  routine: Routine | null;
  onSave: (routine: Routine) => void;
  onCancel: () => void;
}

const ALL_DAYS: DayOfWeek[] = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export function RoutineForm({ routine, onSave, onCancel }: RoutineFormProps) {
  const [title, setTitle] = useState(routine?.title || '');
  const [time, setTime] = useState(routine?.time || '');
  const [days, setDays] = useState<DayOfWeek[]>(routine?.days || ALL_DAYS);
  
  const handleToggleDay = (day: DayOfWeek) => {
    if (days.includes(day)) {
      setDays(days.filter(d => d !== day));
    } else {
      setDays([...days, day]);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || days.length === 0) return;
    
    onSave({
      id: routine?.id || uuid(),
      title: title.trim(),
      time: time || undefined,
      days,
      completed: routine?.completed || {}
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
          placeholder="Например: Утренняя зарядка"
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
      
      <div className="form-group">
        <label className="form-label">Дни недели</label>
        <div className="days-selector">
          {ALL_DAYS.map(day => (
            <button
              key={day}
              type="button"
              className={`day-btn ${days.includes(day) ? 'active' : ''}`}
              onClick={() => handleToggleDay(day)}
            >
              {day}
            </button>
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
          disabled={!title.trim() || days.length === 0}
        >
          Сохранить
        </button>
      </div>
    </form>
  );
}

