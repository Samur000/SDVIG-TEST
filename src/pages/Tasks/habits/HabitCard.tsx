import { Habit } from '../../../types';
import { HabitIconComponent } from './HabitIcons';
import { StreakRow } from './StreakRow';
import { Checkbox } from '../../../components/UI';
import './Habits.css';

interface HabitCardProps {
  habit: Habit;
  isCompletedToday: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitCard({ habit, isCompletedToday, onToggle, onEdit, onDelete }: HabitCardProps) {
  // Защита от неполных данных привычки (после импорта старых бэкапов)
  const streak = habit.streak ?? 0;
  const bestStreak = habit.bestStreak ?? 0;
  const records = Array.isArray(habit.records) ? habit.records : [];
  const isNewBestStreak = streak === bestStreak && streak > 0;

  return (
    <div 
      className={`habit-card ${isNewBestStreak ? 'best-streak' : ''}`}
      style={{ '--habit-color': habit.color } as React.CSSProperties}
    >
      <div className="habit-card-header">
        <div className="habit-card-icon" style={{ color: habit.color }}>
          <HabitIconComponent icon={habit.icon} color={habit.color} size={28} />
        </div>
        
        <div className="habit-card-info">
          <span className="habit-card-title">{habit.title}</span>
          {habit.description && (
            <span className="habit-card-desc">{habit.description}</span>
          )}
        </div>

        <Checkbox 
          checked={isCompletedToday}
          onChange={onToggle}
          size="md"
          color={habit.color}
        />
      </div>

      <div className="habit-card-stats">
        <div className="habit-stat-item">
          <span className="habit-stat-value" style={{ color: habit.color }}>{streak}</span>
          <span className="habit-stat-label">дней подряд</span>
        </div>
        <div className="habit-stat-divider" />
        <div className="habit-stat-item">
          <span className="habit-stat-value">{bestStreak}</span>
          <span className="habit-stat-label">лучший</span>
        </div>
      </div>

      <StreakRow records={records} color={habit.color} createdAt={habit.createdAt} />

      <div className="habit-card-actions">
        <button className="habit-action-btn" onClick={onEdit}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button className="habit-action-btn danger" onClick={onDelete}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

