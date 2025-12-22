import { useMemo } from 'react';
import './Habits.css';

interface StreakGridProps {
  records: string[];
  color: string;
  createdAt: string;
}

// Форматирование даты в локальном часовом поясе
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface DayData {
  date: string;
  day: number;
  completed: boolean;
  isFuture: boolean;
}

interface MonthData {
  key: string;
  days: DayData[];
}

export function StreakRow({ records, color, createdAt }: StreakGridProps) {
  const safeRecords = Array.isArray(records) ? records : [];
  
  const months = useMemo(() => {
    const result: MonthData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatLocalDate(today);
    
    // Определяем startDate — дату первого выполнения привычки
    let startDate: Date;
    
    if (safeRecords.length > 0) {
      // Берём самую раннюю дату из records
      const sortedRecords = [...safeRecords].sort();
      startDate = new Date(sortedRecords[0] + 'T00:00:00');
    } else if (createdAt) {
      // Если записей нет, но есть createdAt
      const parsed = new Date(createdAt);
      if (!isNaN(parsed.getTime())) {
        startDate = new Date(parsed);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      }
    } else {
      // Fallback — начало текущего месяца
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    // Генерируем месяцы от startDate до сегодня
    let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    while (currentMonth <= todayMonth) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
      
      const days: DayData[] = [];
      
      // Генерируем все дни месяца
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatLocalDate(date);
        const isFuture = isCurrentMonth && dateStr > todayStr;
        
        days.push({
          date: dateStr,
          day,
          completed: safeRecords.includes(dateStr),
          isFuture
        });
      }
      
      result.push({
        key: `${year}-${month}`,
        days
      });
      
      currentMonth = new Date(year, month + 1, 1);
    }
    
    return result;
  }, [safeRecords, createdAt]);

  return (
    <div className="streak-grid">
      {months.map((monthData) => (
        <div key={monthData.key} className="streak-month">
          <div className="streak-row">
            {monthData.days.map((sq) => (
              <div
                key={sq.date}
                className={`streak-square ${sq.completed ? 'completed' : ''} ${sq.isFuture ? 'future' : ''}`}
                style={{
                  backgroundColor: sq.completed ? color : 'transparent',
                  borderColor: sq.completed ? color : 'var(--border)'
                }}
                title={`${sq.day} — ${sq.completed ? 'выполнено' : sq.isFuture ? 'будущий день' : 'пропущено'}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

