import { useState, useMemo } from 'react';
import { 
  getMonthCalendarDates, 
  getMonthName, 
  formatDate, 
  isToday, 
  isSameMonth
} from '../../utils/date';
import './Calendar.css';

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  eventsMap: Record<string, boolean>; // dateStr -> hasEvents
  onClose: () => void;
}

const DAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export function Calendar({ selectedDate, onSelectDate, eventsMap, onClose }: CalendarProps) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const calendarDates = useMemo(() => 
    getMonthCalendarDates(year, month), 
    [year, month]
  );
  
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };
  
  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };
  
  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    onSelectDate(today);
    onClose();
  };
  
  const handleSelectDate = (date: Date) => {
    onSelectDate(date);
    onClose();
  };

  return (
    <div className="calendar">
      {/* Шапка с навигацией по месяцам */}
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={handlePrevMonth}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        
        <div className="calendar-title">
          <span className="calendar-month">{getMonthName(month)}</span>
          <span className="calendar-year">{year}</span>
        </div>
        
        <button className="calendar-nav-btn" onClick={handleNextMonth}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
      
      {/* Кнопка "Сегодня" */}
      <button className="calendar-today-btn" onClick={handleToday}>
        Сегодня
      </button>
      
      {/* Дни недели */}
      <div className="calendar-weekdays">
        {DAY_LABELS.map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
      </div>
      
      {/* Сетка дней */}
      <div className="calendar-grid">
        {calendarDates.map((date, idx) => {
          const dateStr = formatDate(date);
          const isCurrentMonth = isSameMonth(date, month, year);
          const isSelected = formatDate(selectedDate) === dateStr;
          const isTodayDate = isToday(date);
          const hasEvents = eventsMap[dateStr];
          
          return (
            <button
              key={idx}
              className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''}`}
              onClick={() => handleSelectDate(date)}
            >
              <span className="calendar-day-num">{date.getDate()}</span>
              {hasEvents && <span className="calendar-day-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

