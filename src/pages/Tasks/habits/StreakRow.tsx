import { useMemo } from 'react';
import { formatDateLocal } from '../../../utils/date';
import './Habits.css';

interface StreakRowProps {
  records: string[];
  color: string;
}

export function StreakRow({ records, color }: StreakRowProps) {
  const squares = useMemo(() => {
    const result: { date: string; completed: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Начало текущего месяца
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Количество дней от начала месяца до сегодня
    const daysInMonth = Math.floor((today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Генерируем квадраты от начала месяца до сегодня
    for (let i = 0; i < daysInMonth; i++) {
      const date = new Date(monthStart);
      date.setDate(monthStart.getDate() + i);
      const dateStr = formatDateLocal(date);
      result.push({
        date: dateStr,
        completed: records.includes(dateStr)
      });
    }
    
    return result;
  }, [records]);

  return (
    <div className="streak-row">
      {squares.map((sq, index) => (
        <div
          key={sq.date}
          className={`streak-square ${sq.completed ? 'completed' : ''}`}
          style={{
            backgroundColor: sq.completed ? color : 'transparent',
            borderColor: sq.completed ? color : 'var(--border)',
            animationDelay: sq.completed ? `${index * 20}ms` : '0ms'
          }}
          title={sq.date}
        />
      ))}
    </div>
  );
}

