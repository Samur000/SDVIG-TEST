import { useState, useEffect } from 'react';
import { Modal } from '../../../components/Modal';
import { Habit, HabitIcon, HabitColor } from '../../../types';
import { HabitIconComponent, HABIT_ICONS, HABIT_COLORS } from './HabitIcons';
import { v4 as uuid } from 'uuid';
import './Habits.css';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Habit) => void;
  editingHabit?: Habit | null;
}

export function CreateHabitModal({ isOpen, onClose, onSave, editingHabit }: CreateHabitModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<HabitIcon>('book');
  const [color, setColor] = useState<HabitColor>('#13b4ff');

  // Сброс/заполнение формы при открытии модалки или смене editingHabit
  useEffect(() => {
    if (isOpen) {
      if (editingHabit) {
        setTitle(editingHabit.title);
        setDescription(editingHabit.description || '');
        setIcon(editingHabit.icon);
        setColor(editingHabit.color);
      } else {
        setTitle('');
        setDescription('');
        setIcon('book');
        setColor('#13b4ff');
      }
    }
  }, [isOpen, editingHabit]);

  const handleSubmit = () => {
    if (!title.trim()) return;

    const habit: Habit = {
      id: editingHabit?.id || uuid(),
      title: title.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      records: editingHabit?.records || [],
      streak: editingHabit?.streak || 0,
      bestStreak: editingHabit?.bestStreak || 0,
      createdAt: editingHabit?.createdAt || new Date().toISOString()
    };

    onSave(habit);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title={editingHabit ? 'Редактировать привычку' : 'Новая привычка'}
    >
      <div className="create-habit-form">
        {/* Title input */}
        <div className="habit-form-group">
          <input
            type="text"
            className="habit-title-input"
            placeholder="Название привычки"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* Description input */}
        <div className="habit-form-group">
          <input
            type="text"
            className="habit-desc-input"
            placeholder="Описание (опционально)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Icon selector */}
        <div className="habit-form-group">
          <label className="habit-form-label">Иконка</label>
          <div className="habit-icon-grid">
            {HABIT_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                className={`habit-icon-btn ${icon === ic ? 'active' : ''}`}
                onClick={() => setIcon(ic)}
                style={{ 
                  borderColor: icon === ic ? color : 'var(--border)',
                  backgroundColor: icon === ic ? `${color}20` : 'transparent'
                }}
              >
                <HabitIconComponent 
                  icon={ic} 
                  color={icon === ic ? color : 'var(--muted)'} 
                  size={22} 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Color selector */}
        <div className="habit-form-group">
          <label className="habit-form-label">Цвет</label>
          <div className="habit-color-grid">
            {HABIT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`habit-color-btn ${color === c ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c as HabitColor)}
              >
                {color === c && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="habit-preview">
          <div className="habit-preview-icon" style={{ color }}>
            <HabitIconComponent icon={icon} color={color} size={32} />
          </div>
          <span className="habit-preview-title">{title || 'Название'}</span>
        </div>

        {/* Actions */}
        <div className="habit-form-actions">
          <button type="button" className="btn" onClick={handleClose}>
            Отмена
          </button>
          <button 
            type="button" 
            className="btn btn-primary filled"
            onClick={handleSubmit}
            disabled={!title.trim()}
          >
            {editingHabit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

