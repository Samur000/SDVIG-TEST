import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import { Task } from '../../types';
import './Forms.css';

interface BreakdownModalProps {
  task: Task;
  onSave: (task: Task, subtasks: string[]) => void;
  onClose: () => void;
}

export function BreakdownModal({ task, onSave, onClose }: BreakdownModalProps) {
  const [subtasks, setSubtasks] = useState<string[]>(['']);
  
  const handleChange = (index: number, value: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = value;
    setSubtasks(newSubtasks);
  };
  
  const handleAddSubtask = () => {
    setSubtasks([...subtasks, '']);
  };
  
  const handleRemoveSubtask = (index: number) => {
    if (subtasks.length <= 1) return;
    const newSubtasks = subtasks.filter((_, i) => i !== index);
    setSubtasks(newSubtasks);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSubtasks = subtasks.filter(s => s.trim());
    if (validSubtasks.length === 0) return;
    onSave(task, validSubtasks);
  };
  
  return (
    <Modal isOpen={true} onClose={onClose} title="Разбить задачу">
      <div className="breakdown-content">
        <div className="breakdown-task">
          <span className="breakdown-label">Задача:</span>
          <span className="breakdown-title">{task.title}</span>
        </div>
        
        <p className="breakdown-hint">
          Разбей задачу на маленькие шаги. Что можно сделать прямо сейчас?
        </p>
        
        <form className="form" onSubmit={handleSubmit}>
          {subtasks.map((subtask, index) => (
            <div key={index} className="form-group subtask-input-group">
              <input
                type="text"
                value={subtask}
                onChange={e => handleChange(index, e.target.value)}
                placeholder={`Шаг ${index + 1}`}
                autoFocus={index === subtasks.length - 1}
              />
              {subtasks.length > 1 && (
                <button 
                  type="button" 
                  className="subtask-remove-btn"
                  onClick={() => handleRemoveSubtask(index)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          <button 
            type="button" 
            className="add-subtask-btn"
            onClick={handleAddSubtask}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Добавить ещё
          </button>
          
          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button 
              type="submit" 
              className="btn btn-primary filled"
              disabled={subtasks.every(s => !s.trim())}
            >
              Создать подзадачи
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

