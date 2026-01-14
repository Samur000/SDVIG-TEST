import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { useApp } from '../../store/AppContext';
import { Event } from '../../types';
import {
  formatDate,
  getDayName,
  getMonthName,
  addDays,
  getWeekDates
} from '../../utils/date';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { EventForm } from './EventForm';
import { EventDetailsModal } from './EventDetailsModal';
import { Modal } from '../../components/Modal';
import './CalendarPage.css';

type ViewMode = 'day' | 'week' | 'month';

export function CalendarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useApp();
  
  // Получаем выбранную дату из location.state или используем сегодня
  const initialDate = location.state?.selectedDate ? new Date(location.state.selectedDate) : new Date();
  const [viewDate, setViewDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Свайп-навигация
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Минимальная дистанция для свайпа
  const MIN_SWIPE_DISTANCE = 50;
  
  // Обновление выбранной даты из location.state
  useEffect(() => {
    if (location.state?.selectedDate) {
      const date = new Date(location.state.selectedDate);
      setSelectedDate(date);
      setViewDate(date);
    }
  }, [location.state]);
  
  // Состояние для направления анимации
  const [animationDirection, setAnimationDirection] = useState<'prev' | 'next' | null>(null);
  
  // Единая функция для навигации с анимацией
  const navigateWithAnimation = useCallback((direction: 'prev' | 'next') => {
    if (isTransitioning) return; // Предотвращаем множественные переходы
    
    setAnimationDirection(direction);
    setIsTransitioning(true);
    
    // Небольшая задержка для начала анимации
    requestAnimationFrame(() => {
      // Изменяем дату
      if (direction === 'prev') {
        if (viewMode === 'day') {
          setViewDate(prev => addDays(prev, -1));
          setSelectedDate(prev => addDays(prev, -1));
        } else if (viewMode === 'week') {
          setViewDate(prev => addDays(prev, -7));
          setSelectedDate(prev => addDays(prev, -7));
        } else if (viewMode === 'month') {
          const newDate = new Date(viewDate);
          newDate.setMonth(newDate.getMonth() - 1);
          setViewDate(newDate);
        }
      } else {
        if (viewMode === 'day') {
          setViewDate(prev => addDays(prev, 1));
          setSelectedDate(prev => addDays(prev, 1));
        } else if (viewMode === 'week') {
          setViewDate(prev => addDays(prev, 7));
          setSelectedDate(prev => addDays(prev, 7));
        } else if (viewMode === 'month') {
          const newDate = new Date(viewDate);
          newDate.setMonth(newDate.getMonth() + 1);
          setViewDate(newDate);
        }
      }
      
      // Завершаем анимацию после перехода
      setTimeout(() => {
        setIsTransitioning(false);
        setAnimationDirection(null);
      }, 350);
    });
  }, [viewMode, viewDate, isTransitioning]);
  
  // Обработчики свайпов
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
    setIsSwiping(false);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    // Обновляем координаты окончания касания
    if (touchStartX.current !== null && touchStartY.current !== null) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      
      touchEndX.current = currentX;
      touchEndY.current = currentY;
      
      // Определяем направление свайпа
      const distanceX = Math.abs(currentX - touchStartX.current);
      const distanceY = Math.abs(currentY - touchStartY.current);
      
      // Если это горизонтальный свайп (даже небольшой), блокируем вертикальный скролл
      // Проверяем, что горизонтальное движение больше вертикального и превышает минимальный порог
      if (distanceX > 8 && distanceX > distanceY) {
        // Помечаем, что идет горизонтальный свайп
        if (!isSwiping) {
          setIsSwiping(true);
        }
        // Блокируем вертикальный скролл при горизонтальном свайпе
        if (e.cancelable) {
          e.preventDefault();
        }
      } else if (isSwiping && distanceY > distanceX * 1.5) {
        // Если начали вертикальный скролл, отключаем блокировку
        setIsSwiping(false);
      }
    }
  };
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) {
      touchStartX.current = null;
      touchStartY.current = null;
      touchEndX.current = null;
      touchEndY.current = null;
      setIsSwiping(false);
      return;
    }
    
    // Если touchEndX/touchEndY не были установлены, используем touchStart значения
    const endX = touchEndX.current ?? touchStartX.current;
    const endY = touchEndY.current ?? touchStartY.current;
    
    const distanceX = endX - touchStartX.current;
    const distanceY = endY - touchStartY.current;
    
    // Проверяем, что это горизонтальный свайп (не вертикальный скролл)
    if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > MIN_SWIPE_DISTANCE) {
      if (e.cancelable) {
        e.preventDefault();
      }
      if (distanceX > 0) {
        // Свайп вправо - предыдущий период
        navigateWithAnimation('prev');
      } else {
        // Свайп влево - следующий период
        navigateWithAnimation('next');
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
    setIsSwiping(false);
  }, [navigateWithAnimation, isSwiping]);
  
  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    setSelectedDate(today);
  };
  
  // Обработчики событий
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };
  
  const handleEditEvent = () => {
    if (selectedEvent) {
      setEditingEvent(selectedEvent);
      setSelectedEvent(null);
      setShowEventForm(true);
    }
  };
  
  const handleDeleteEvent = () => {
    if (selectedEvent && confirm('Удалить событие?')) {
      dispatch({ type: 'DELETE_EVENT', payload: selectedEvent.id });
      setSelectedEvent(null);
    }
  };
  
  const handleToggleEvent = () => {
    if (selectedEvent) {
      dispatch({ type: 'TOGGLE_EVENT', payload: selectedEvent.id });
      // Обновляем selectedEvent с новым состоянием completed
      const updatedEvent = { ...selectedEvent, completed: !selectedEvent.completed };
      setSelectedEvent(updatedEvent);
    }
  };
  
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setViewDate(date);
    if (viewMode !== 'day') {
      setViewMode('day');
    }
  };
  
  const handleSaveEvent = (event: Event) => {
    if (editingEvent) {
      dispatch({ type: 'UPDATE_EVENT', payload: event });
    } else {
      dispatch({ type: 'ADD_EVENT', payload: event });
    }
    setShowEventForm(false);
    setEditingEvent(null);
  };
  
  // Получение заголовка в зависимости от режима
  const getHeaderTitle = () => {
    if (viewMode === 'day') {
      return `${getDayName(selectedDate)}, ${selectedDate.getDate()} ${getMonthName(selectedDate.getMonth()).toLowerCase()}`;
    } else if (viewMode === 'week') {
      const weekDates = getWeekDates(selectedDate);
      const start = weekDates[0];
      const end = weekDates[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()}–${end.getDate()} ${getMonthName(start.getMonth()).toLowerCase()}`;
      }
      return `${start.getDate()} ${getMonthName(start.getMonth()).toLowerCase()} – ${end.getDate()} ${getMonthName(end.getMonth()).toLowerCase()}`;
    } else {
      return `${getMonthName(viewDate.getMonth())} ${viewDate.getFullYear()}`;
    }
  };
  
  const defaultDate = formatDate(selectedDate);
  
  return (
    <Layout 
      title={getHeaderTitle()}
      headerRight={
        <>
          <button 
            className="calendar-header-btn"
            onClick={handleToday}
            title="Сегодня"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </button>
          <button 
            className="header-back-btn" 
            onClick={() => navigate(-1)}
            title="Назад"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        </>
      }
    >
      <div 
        className="calendar-page"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Переключение режимов */}
        <div className="calendar-mode-selector">
          <button
            className={`calendar-mode-btn ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => setViewMode('day')}
          >
            День
          </button>
          <button
            className={`calendar-mode-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Неделя
          </button>
          <button
            className={`calendar-mode-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Месяц
          </button>
        </div>
        
        {/* Контент в зависимости от режима */}
        <div 
          className={`calendar-content ${isTransitioning ? (animationDirection === 'next' ? 'transitioning-next' : 'transitioning') : ''} ${isSwiping ? 'swiping' : ''}`}
          ref={contentRef}
          style={isSwiping ? { overflowY: 'hidden', touchAction: 'none' } : undefined}
        >
          {viewMode === 'day' && (
            <DayView 
              date={selectedDate}
              events={state.events}
              onEventClick={handleEventClick}
            />
          )}
          {viewMode === 'week' && (
            <WeekView 
              date={selectedDate}
              events={state.events}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
            />
          )}
          {viewMode === 'month' && (
            <MonthView 
              viewDate={viewDate}
              selectedDate={selectedDate}
              events={state.events}
              onSelectDate={handleDateClick}
            />
          )}
        </div>
        
        {/* Кнопка добавления события */}
        <button 
          className="calendar-add-btn"
          onClick={() => {
            setEditingEvent(null);
            setShowEventForm(true);
          }}
          title="Добавить событие"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
      
      {/* Модалка деталей события */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onToggle={handleToggleEvent}
        />
      )}
      
      {/* Модалка формы события */}
      <Modal
        isOpen={showEventForm}
        onClose={() => {
          setShowEventForm(false);
          setEditingEvent(null);
        }}
        title={editingEvent ? 'Редактировать событие' : 'Новое событие'}
      >
        <EventForm
          event={editingEvent}
          defaultDate={defaultDate}
          onSave={handleSaveEvent}
          onCancel={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
        />
      </Modal>
    </Layout>
  );
}
