import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Modal } from '../../components/Modal';
import { Checkbox, EmptyState, useToast } from '../../components/UI';
import { useApp } from '../../store/AppContext';
import { vibrate, getRandomMotivation } from '../../utils/feedback';
import { DayOfWeek, Routine, Event, DayTask } from '../../types';
import {
	formatDate,
	getDayOfWeek,
	getDayName,
	formatDateFull,
	getWeekDates,
	isToday,
	addDays
} from '../../utils/date';
import { v4 as uuid } from 'uuid';
import { RoutineForm } from './RoutineForm';
import { EventForm } from './EventForm';
import { EventDetailsModal } from './EventDetailsModal';
import { formatTime } from './CalendarUtils';
import './DayPage.css';
import './Forms.css';

const DAY_LABELS: DayOfWeek[] = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

export function DayPage() {
	const { state, dispatch } = useApp();
	const { showToast } = useToast();
	const navigate = useNavigate();
	const location = useLocation();
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [showRoutineForm, setShowRoutineForm] = useState(false);
	const [showEventForm, setShowEventForm] = useState(false);
	const [showDayTaskForm, setShowDayTaskForm] = useState(false);
	const [dayTaskTitle, setDayTaskTitle] = useState('');
	const [editingDayTask, setEditingDayTask] = useState<DayTask | null>(null);
	const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
	const [editingEvent, setEditingEvent] = useState<Event | null>(null);
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

	// Свайп-навигация
	const touchStartX = useRef<number | null>(null);
	const touchEndX = useRef<number | null>(null);

	const dateStr = formatDate(selectedDate);
	const dayOfWeek = getDayOfWeek(selectedDate);
	const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
	const isTodaySelected = isToday(selectedDate);

	// Карта событий для индикаторов (для всех дат)
	const eventsMap = useMemo(() => {
		const map: Record<string, boolean> = {};

		// События
		state.events.forEach(e => {
			if (e.date) {
				map[e.date] = true;
			}
		});

		// Задачи дня
		Object.keys(state.dayTasks).forEach(date => {
			if (state.dayTasks[date]?.length > 0) {
				map[date] = true;
			}
		});

		// Рутины (проверяем для каждого дня недели)
		weekDates.forEach(date => {
			const day = getDayOfWeek(date);
			const hasRoutine = state.routines.some(r => r.days.includes(day));
			if (hasRoutine) {
				map[formatDate(date)] = true;
			}
		});

		return map;
	}, [state.events, state.dayTasks, state.routines, weekDates]);

	// Фильтруем рутины для текущего дня недели
	const todayRoutines = useMemo(() =>
		state.routines.filter(r => r.days.includes(dayOfWeek)),
		[state.routines, dayOfWeek]
	);

	// События на выбранную дату (поддержка старого формата date и нового startTime)
	const todayEvents = useMemo(() => {
		return state.events.filter(e => {
			// Если есть startTime (новый формат)
			if (e.startTime) {
				const startTime = typeof e.startTime === 'string' ? new Date(e.startTime) : e.startTime;
				return formatDate(startTime) === dateStr;
			}
			// Если есть date (старый формат для совместимости)
			if (e.date) {
				return e.date === dateStr;
			}
			return false;
		});
	}, [state.events, dateStr]);

	// 3 главные задачи дня
	const dayTasks = state.dayTasks[dateStr] || [];

	// Функция для получения времени события (для отображения)
	const getEventTimeDisplay = (event: Event): string => {
		if (event.startTime && event.endTime) {
			const startTime = typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime;
			const endTime = typeof event.endTime === 'string' ? new Date(event.endTime) : event.endTime;
			if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
				return `${formatTime(startTime)} - ${formatTime(endTime)}`;
			}
		}
		// Для старых событий без времени
		if (event.time) {
			return event.time;
		}
		return '—';
	};

	// Функция для получения времени начала события (для сортировки)
	const getEventStartTime = (event: Event): string => {
		if (event.startTime) {
			const startTime = typeof event.startTime === 'string' ? new Date(event.startTime) : event.startTime;
			if (!isNaN(startTime.getTime())) {
				const hours = startTime.getHours().toString().padStart(2, '0');
				const minutes = startTime.getMinutes().toString().padStart(2, '0');
				return `${hours}:${minutes}`;
			}
		}
		return event.time || '99:99';
	};

	// Сортируем все по времени
	const sortedItems = useMemo(() => {
		const items: Array<{ type: 'routine' | 'event'; item: Routine | Event; time: string; timeDisplay?: string }> = [];

		todayRoutines.forEach(r => {
			items.push({ type: 'routine', item: r, time: r.time || '99:99' });
		});

		todayEvents.forEach(e => {
			items.push({ 
				type: 'event', 
				item: e, 
				time: getEventStartTime(e),
				timeDisplay: getEventTimeDisplay(e)
			});
		});

		return items.sort((a, b) => a.time.localeCompare(b.time));
	}, [todayRoutines, todayEvents]);

	// Навигация по неделям
	const goToPrevWeek = useCallback(() => {
		setSelectedDate(prev => addDays(prev, -1));
	}, []);

	const goToNextWeek = useCallback(() => {
		setSelectedDate(prev => addDays(prev, 1));
	}, []);

	const goToToday = useCallback(() => {
		setSelectedDate(new Date());
	}, []);

	// Обработчики свайпа
	const handleTouchStart = (e: React.TouchEvent) => {
		touchStartX.current = e.touches[0].clientX;
		touchEndX.current = null;
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		touchEndX.current = e.touches[0].clientX;
	};


	// Проверка выполнения рутины
	const isRoutineCompleted = (routine: Routine) => {
		return routine.completed[dateStr] || false;
	};

	// Подсчёт выполненных задач дня
	const completedDayTasks = dayTasks.filter(t => t.completed).length;

	// Добавление задачи дня
	const handleAddDayTask = () => {
		if (dayTasks.length >= 3) return;
		setShowDayTaskForm(true);
	};

	const handleSaveDayTask = () => {
		if (!dayTaskTitle.trim()) return;

		if (editingDayTask) {
			dispatch({
				type: 'UPDATE_DAY_TASK',
				payload: {
					date: dateStr,
					task: { ...editingDayTask, title: dayTaskTitle.trim() }
				}
			});
		} else {
			const newTask: DayTask = {
				id: uuid(),
				title: dayTaskTitle.trim(),
				completed: false,
				date: dateStr
			};

			dispatch({
				type: 'SET_DAY_TASKS',
				payload: { date: dateStr, tasks: [...dayTasks, newTask] }
			});
		}

		setDayTaskTitle('');
		setEditingDayTask(null);
		setShowDayTaskForm(false);
	};

	// Удаление задачи дня
	const handleDeleteDayTask = (taskId: string) => {
		if (confirm('Удалить задачу?')) {
			dispatch({ type: 'DELETE_DAY_TASK', payload: { date: dateStr, taskId } });
		}
	};

	// Редактирование задачи дня
	const handleEditDayTask = (task: DayTask) => {
		setEditingDayTask(task);
		setDayTaskTitle(task.title);
		setShowDayTaskForm(true);
	};

	// Переключение задачи дня
	const handleToggleDayTask = (taskId: string) => {
		const task = dayTasks.find(t => t.id === taskId);
		const willBeCompleted = task && !task.completed;

		dispatch({ type: 'TOGGLE_DAY_TASK', payload: { date: dateStr, taskId } });

		if (willBeCompleted) {
			vibrate(50);
			showToast(getRandomMotivation());
		}
	};

	// Переключение рутины
	const handleToggleRoutine = (id: string) => {
		const routine = state.routines.find(r => r.id === id);
		const willBeCompleted = routine && !routine.completed[dateStr];

		dispatch({ type: 'TOGGLE_ROUTINE', payload: { id, date: dateStr } });

		if (willBeCompleted) {
			vibrate(50);
			showToast(getRandomMotivation());
		}
	};

	// Переключение события
	const handleToggleEvent = (id: string) => {
		const event = state.events.find(e => e.id === id);
		const willBeCompleted = event && !event.completed;

		dispatch({ type: 'TOGGLE_EVENT', payload: id });

		if (willBeCompleted) {
			vibrate(50);
			showToast(getRandomMotivation());
		}
	};

	// Перенос события на завтра
	const handleMoveToTomorrow = (id: string) => {
		dispatch({ type: 'MOVE_EVENT_TO_TOMORROW', payload: id });
	};

	// Обработчики форм
	const handleSaveRoutine = (routine: Routine) => {
		if (editingRoutine) {
			dispatch({ type: 'UPDATE_ROUTINE', payload: routine });
		} else {
			dispatch({ type: 'ADD_ROUTINE', payload: routine });
		}
		setShowRoutineForm(false);
		setEditingRoutine(null);
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

	const handleDeleteRoutine = (id: string) => {
		if (confirm('Удалить рутину?')) {
			dispatch({ type: 'DELETE_ROUTINE', payload: id });
		}
	};

	const handleDeleteEvent = (id: string) => {
		if (confirm('Удалить событие?')) {
			dispatch({ type: 'DELETE_EVENT', payload: id });
		}
	};

	// Обновление выбранной даты из location.state (когда возвращаемся с календаря)
	useEffect(() => {
		if (location.state?.selectedDate) {
			setSelectedDate(new Date(location.state.selectedDate));
		}
	}, [location.state]);

	return (
		<Layout
			title={getDayName(selectedDate)}
			subtitle={formatDateFull(selectedDate)}
			headerRight={
				<button 
					className="header-calendar-btn" 
					onClick={() => navigate('/calendar', { state: { selectedDate } })} 
					title="Открыть календарь"
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<rect x="3" y="4" width="18" height="18" rx="2" />
						<line x1="16" y1="2" x2="16" y2="6" />
						<line x1="8" y1="2" x2="8" y2="6" />
						<line x1="3" y1="10" x2="21" y2="10" />
					</svg>
				</button>
			}
		>
			{/* Навигация по неделям */}
			<div
				className="week-navigation"
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
			>
				{/* Стрелка влево */}
				<button className="week-nav-arrow" onClick={goToPrevWeek} title="Предыдущая неделя">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<polyline points="15 18 9 12 15 6" />
					</svg>
				</button>

				{/* Полоска дней недели */}
				<div className="week-strip">
					{weekDates.map((date, idx) => {
						const isSelected = formatDate(date) === dateStr;
						const isTodayDate = isToday(date);
						const dayDateStr = formatDate(date);
						const hasEvents = eventsMap[dayDateStr];

						return (
							<button
								key={idx}
								className={`week-day ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''}`}
								onClick={() => setSelectedDate(date)}
							>
								<span className="week-day-name">{DAY_LABELS[idx]}</span>
								<span className="week-day-num">{date.getDate()}</span>
								{hasEvents && <span className="week-day-dot" />}
								{isTodayDate && !isSelected && <span className="week-day-today-mark" />}
							</button>
						);
					})}
				</div>

				{/* Стрелка вправо */}
				<button className="week-nav-arrow" onClick={goToNextWeek} title="Следующая неделя">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<polyline points="9 18 15 12 9 6" />
					</svg>
				</button>
			</div>

			{/* Кнопка "Сегодня" (показываем если выбран не сегодняшний день) */}
			{!isTodaySelected && (
				<button className="today-chip" onClick={goToToday}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<circle cx="12" cy="12" r="10" />
						<polyline points="12 6 12 12 16 14" />
					</svg>
					Сегодня
				</button>
			)}

			{/* Основной контент */}
			<div
				className="day-content"
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
			>
				{/* 3 главные задачи дня */}
				<div className="day-tasks-card card-accent">
					<div className="day-tasks-header">
						<h3>3 главные задачи дня</h3>
						<span className="day-tasks-counter">{completedDayTasks} / 3</span>
					</div>
					<div className="day-tasks-list">
						{dayTasks.map(task => (
							<div key={task.id} className="day-task-item">
								<Checkbox
									checked={task.completed}
									onChange={() => handleToggleDayTask(task.id)}
								/>
								<span className={`day-task-title ${task.completed ? 'line-through' : ''}`}>{task.title}</span>
								<div className="day-task-actions">
									<button
										className="btn-icon-mini"
										title="Редактировать"
										onClick={() => handleEditDayTask(task)}
									>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
											<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
										</svg>
									</button>
									<button
										className="btn-icon-mini text-danger"
										title="Удалить"
										onClick={() => handleDeleteDayTask(task.id)}
									>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<polyline points="3 6 5 6 21 6" />
											<path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
										</svg>
									</button>
								</div>
							</div>
						))}
						{dayTasks.length < 3 && (
							<button className="day-task-add" onClick={handleAddDayTask}>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<line x1="12" y1="5" x2="12" y2="19" />
									<line x1="5" y1="12" x2="19" y2="12" />
								</svg>
								Добавить задачу
							</button>
						)}
					</div>
				</div>

				{/* Расписание */}
				<div className="schedule-section">
					<div className="schedule-header">
						<h3>Расписание</h3>
						<div className="schedule-actions">
							<button className="btn btn-sm" onClick={() => setShowRoutineForm(true)}>
								+ Рутина
							</button>
							<button className="btn btn-sm btn-primary" onClick={() => setShowEventForm(true)}>
								+ Событие
							</button>
						</div>
					</div>

					{sortedItems.length === 0 ? (
						<EmptyState
							title="Расписание пусто"
							text="Добавьте рутины и события на этот день"
							icon={
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
									<rect x="3" y="4" width="18" height="18" rx="2" />
									<line x1="16" y1="2" x2="16" y2="6" />
									<line x1="8" y1="2" x2="8" y2="6" />
									<line x1="3" y1="10" x2="21" y2="10" />
								</svg>
							}
						/>
					) : (
						<div className="schedule-list">
							{sortedItems.map(({ type, item, timeDisplay }) => {
								const event = type === 'event' ? (item as Event) : null;
								const eventColor = event?.color || '#4285F4';
								
								return (
								<div 
									key={item.id} 
									className={`schedule-item ${type === 'event' ? 'schedule-item-event' : ''}`}
									style={type === 'event' ? {
										backgroundColor: eventColor + '15',
										borderLeftColor: eventColor,
										borderLeftWidth: '4px',
										cursor: 'pointer'
									} : undefined}
									onClick={type === 'event' ? () => setSelectedEvent(item as Event) : undefined}
								>
									<div className="schedule-item-time">
										{type === 'event' && timeDisplay ? timeDisplay : (item as Routine | Event).time || '—'}
									</div>
									<div className="schedule-item-content">
										<div className="schedule-item-main">
											<div onClick={type === 'event' ? (e) => e.stopPropagation() : undefined}>
												<Checkbox
													checked={type === 'routine'
														? isRoutineCompleted(item as Routine)
														: (item as Event).completed
													}
													onChange={() => type === 'routine'
														? handleToggleRoutine(item.id)
														: handleToggleEvent(item.id)
													}
												/>
											</div>
											<div className="schedule-item-text">
												<span className={
													(type === 'routine' ? isRoutineCompleted(item as Routine) : (item as Event).completed)
														? 'line-through' : ''
												}>
													{item.title}
												</span>
												{(item as Routine | Event).description && (
													<span className="schedule-item-description">
														{(item as Routine | Event).description}
													</span>
												)}
											</div>
											{type === 'routine' && (
												<span className="chip chip-sm">рутина</span>
											)}
										</div>
										<div 
											className="schedule-item-actions"
											onClick={type === 'event' ? (e) => e.stopPropagation() : undefined}
										>
											<button
												className="btn-icon"
												title="Фокус"
												onClick={() => {
													// Устанавливаем задачу в таймер и переходим на страницу фокуса
													dispatch({
														type: 'UPDATE_TIMER_STATE',
														payload: {
															mode: 'focus',
															timeLeft: 25 * 60, // 25 минут по умолчанию
															isRunning: false,
															sessionsCompleted: 0,
															currentTask: item.title,
															focusDuration: 25,
															startedAt: undefined
														}
													});
													navigate('/focus');
												}}
											>
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<circle cx="12" cy="12" r="10" />
													<circle cx="12" cy="12" r="6" />
													<circle cx="12" cy="12" r="2" />
												</svg>
											</button>
											<button
												className="btn-icon"
												title="Редактировать"
												onClick={() => {
													if (type === 'routine') {
														setEditingRoutine(item as Routine);
														setShowRoutineForm(true);
													} else {
														setEditingEvent(item as Event);
														setShowEventForm(true);
													}
												}}
											>
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
													<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
												</svg>
											</button>
											{type === 'event' && (
												<button
													className="btn-icon"
													title="Перенести на завтра"
													onClick={() => handleMoveToTomorrow(item.id)}
												>
													<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
														<polyline points="9 18 15 12 9 6" />
													</svg>
												</button>
											)}
											<button
												className="btn-icon text-danger"
												title="Удалить"
												onClick={() => type === 'routine'
													? handleDeleteRoutine(item.id)
													: handleDeleteEvent(item.id)
												}
											>
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<polyline points="3 6 5 6 21 6" />
													<path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
												</svg>
											</button>
										</div>
									</div>
								</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{/* Модалки */}
			<Modal
				isOpen={showRoutineForm}
				onClose={() => { setShowRoutineForm(false); setEditingRoutine(null); }}
				title={editingRoutine ? 'Редактировать рутину' : 'Новая рутина'}
			>
				<RoutineForm
					routine={editingRoutine}
					onSave={handleSaveRoutine}
					onCancel={() => { setShowRoutineForm(false); setEditingRoutine(null); }}
				/>
			</Modal>

			<Modal
				isOpen={showEventForm}
				onClose={() => { setShowEventForm(false); setEditingEvent(null); }}
				title={editingEvent ? 'Редактировать событие' : 'Новое событие'}
			>
				<EventForm
					event={editingEvent}
					defaultDate={dateStr}
					onSave={handleSaveEvent}
					onCancel={() => { setShowEventForm(false); setEditingEvent(null); }}
				/>
			</Modal>

			<Modal
				isOpen={showDayTaskForm}
				onClose={() => { setShowDayTaskForm(false); setDayTaskTitle(''); setEditingDayTask(null); }}
				title={editingDayTask ? "Редактировать задачу" : "Главная задача дня"}
			>
				<form onSubmit={(e) => { e.preventDefault(); handleSaveDayTask(); }} className="form">
					<div className="form-group">
						<label className="form-label">Название</label>
						<input
							type="text"
							value={dayTaskTitle}
							onChange={(e) => setDayTaskTitle(e.target.value)}
							placeholder="Что важно сделать сегодня?"
							autoFocus
						/>
					</div>
					<div className="form-actions">
						<button type="button" className="btn" onClick={() => { setShowDayTaskForm(false); setDayTaskTitle(''); setEditingDayTask(null); }}>
							Отмена
						</button>
						<button type="submit" className="btn btn-primary filled" disabled={!dayTaskTitle.trim()}>
							{editingDayTask ? 'Сохранить' : 'Добавить'}
						</button>
					</div>
				</form>
			</Modal>

			{/* Модальное окно просмотра события */}
			{selectedEvent && (
				<EventDetailsModal
					event={selectedEvent}
					onClose={() => setSelectedEvent(null)}
					onEdit={() => {
						setEditingEvent(selectedEvent);
						setSelectedEvent(null);
						setShowEventForm(true);
					}}
					onDelete={() => {
						if (confirm('Удалить событие?')) {
							handleDeleteEvent(selectedEvent.id);
							setSelectedEvent(null);
						}
					}}
				/>
			)}

		</Layout>
	);
}
