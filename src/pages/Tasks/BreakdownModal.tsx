import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { Task } from '../../types';
import './Forms.css';

interface BreakdownModalProps {
  task: Task;
  existingSubtasks?: Task[];
  onSave: (task: Task, subtasks: string[]) => void;
  onClose: () => void;
}

export function BreakdownModal({ task, existingSubtasks = [], onSave, onClose }: BreakdownModalProps) {
  const [subtasks, setSubtasks] = useState<string[]>([]);
  
  // Загружаем существующие подзадачи при открытии модального окна
  useEffect(() => {
    if (existingSubtasks.length > 0) {
      setSubtasks(existingSubtasks.map(st => st.title));
    } else {
      setSubtasks(['']);
    }
  }, [existingSubtasks]);
  
  const handleChange = (index: number, value: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = value;
    setSubtasks(newSubtasks);
  };
  
  const handleAddSubtask = () => {
    setSubtasks([...subtasks, '']);
  };
  
  const handleRemoveSubtask = (index: number) => {
    const newSubtasks = subtasks.filter((_, i) => i !== index);
    
    // Если после удаления остался только один элемент
    if (newSubtasks.length === 1) {
      // И этот элемент пустой - удаляем все подзадачи
      if (!newSubtasks[0].trim()) {
        onSave(task, []);
        onClose();
        return;
      }
    }
    
    // Если удалили все, удаляем все подзадачи
    if (newSubtasks.length === 0) {
      onSave(task, []);
      onClose();
      return;
    }
    
    setSubtasks(newSubtasks);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSubtasks = subtasks.filter(s => s.trim());
    // Если все подзадачи пустые или их нет, удаляем все подзадачи
    if (validSubtasks.length === 0) {
      onSave(task, []);
      onClose();
      return;
    }
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
        
        <form className="form breakdown-form" onSubmit={handleSubmit}>
          <div className="breakdown-subtasks-list">
          {subtasks.map((subtask, index) => (
            <div key={index} className="form-group subtask-input-group">
              <input
                type="text"
                value={subtask}
                onChange={e => handleChange(index, e.target.value)}
                placeholder={`Шаг ${index + 1}`}
                autoFocus={index === subtasks.length - 1}
              />
                <button 
                  type="button" 
                  className="subtask-remove-btn"
                  onClick={() => handleRemoveSubtask(index)}
                  title="Удалить шаг"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
            </div>
          ))}
          </div>
          
          <div className="breakdown-footer">
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
                disabled={subtasks.length === 0}
            >
                {existingSubtasks.length > 0 ? 'Сохранить изменения' : 'Создать подзадачи'}
            </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

