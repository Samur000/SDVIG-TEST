import React, { useState } from 'react';
import { Task, TaskPriority, TaskTimeEstimate } from '../../types';
import { getToday } from '../../utils/date';
import { v4 as uuid } from 'uuid';
import './Forms.css';

interface TaskFormProps {
  task: Task | null;
  onSave: (task: Task) => void;
  onCancel: () => void;
}

const TIME_ESTIMATES: { value: TaskTimeEstimate; label: string }[] = [
  { value: null, label: 'Не указано' },
  { value: 5, label: '5 мин' },
  { value: 15, label: '15 мин' },
  { value: 30, label: '30 мин' },
  { value: 60, label: '1 час' },
];

export function TaskForm({ task, onSave, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [date, setDate] = useState(task?.date || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'normal');
  const [timeEstimate, setTimeEstimate] = useState<TaskTimeEstimate>(task?.timeEstimate || null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSave({
      id: task?.id || uuid(),
      title: title.trim(),
      completed: task?.completed || false,
      date: date || undefined,
      priority,
      timeEstimate: timeEstimate || undefined,
      parentId: task?.parentId,
      createdAt: task?.createdAt || new Date().toISOString()
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
          placeholder="Что нужно сделать?"
          required
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Дата (опционально)</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          min={getToday()}
        />
        <p className="form-hint">Оставьте пустым для "Когда-нибудь"</p>
      </div>
      
      <div className="form-group">
        <label className="form-label">Приоритет</label>
        <div className="priority-toggle">
          <button
            type="button"
            className={`priority-btn ${priority === 'normal' ? 'active' : ''}`}
            onClick={() => setPriority('normal')}
          >
            Обычный
          </button>
          <button
            type="button"
            className={`priority-btn important ${priority === 'important' ? 'active' : ''}`}
            onClick={() => setPriority('important')}
          >
            Важный
          </button>
        </div>
      </div>
      
      <div className="form-group">
        <label className="form-label">Оценка времени</label>
        <div className="time-estimates">
          {TIME_ESTIMATES.map(opt => (
            <button
              key={opt.value || 'none'}
              type="button"
              className={`time-btn ${timeEstimate === opt.value ? 'active' : ''}`}
              onClick={() => setTimeEstimate(opt.value)}
            >
              {opt.label}
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
          disabled={!title.trim()}
        >
          Сохранить
        </button>
      </div>
    </form>
  );
}

