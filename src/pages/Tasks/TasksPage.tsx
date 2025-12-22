import { useState, useMemo } from 'react';
import { Layout } from '../../components/Layout';
import { Modal } from '../../components/Modal';
import { Checkbox, EmptyState, useToast } from '../../components/UI';
import { useApp } from '../../store/AppContext';
import { Task, Habit } from '../../types';
import { getToday } from '../../utils/date';
import { vibrate, getRandomMotivation } from '../../utils/feedback';
import { v4 as uuid } from 'uuid';
import { TaskForm } from './TaskForm';
import { BreakdownModal } from './BreakdownModal';
import { HabitCard, CreateHabitModal } from './habits';
import './TasksPage.css';

type TabType = 'todo' | 'habits';

export function TasksPage() {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('todo');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [breakdownTask, setBreakdownTask] = useState<Task | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  
  const today = getToday();
  
  // Форматирование даты создания задачи
  const formatCreatedAt = (isoString: string): string => {
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year}, ${hours}:${minutes}`;
  };
  
  // Расчёт количества прошедших дней
  const getDaysAgo = (isoString: string): number => {
    const created = new Date(isoString);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };
  
  // Форматирование "X дней"
  const formatDaysAgo = (days: number): string => {
    if (days === 0) return '0 дней';
    if (days === 1) return '1 день';
    if (days >= 2 && days <= 4) return `${days} дня`;
    return `${days} дней`;
  };
  
  // Сортировка по времени создания (новые первые)
  const sortByCreatedAt = (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => {
      const timeA = a.createdAt || '';
      const timeB = b.createdAt || '';
      return timeB.localeCompare(timeA);
    });
  };
  
  // Группировка задач (только невыполненные)
  const groupedTasks = useMemo(() => {
    const todayTasks: Task[] = [];
    const weekTasks: Task[] = [];
    const somedayTasks: Task[] = [];
    
    state.tasks.forEach(task => {
      if (task.parentId) return;
      if (task.completed) return;
      
      if (!task.date) {
        somedayTasks.push(task);
      } else if (task.date === today) {
        todayTasks.push(task);
      } else if (task.date > today) {
        weekTasks.push(task);
      }
    });
    
    return { 
      todayTasks: sortByCreatedAt(todayTasks), 
      weekTasks: sortByCreatedAt(weekTasks), 
      somedayTasks: sortByCreatedAt(somedayTasks) 
    };
  }, [state.tasks, today]);
  
  // Архив выполненных задач
  const archivedTasks = useMemo(() => {
    return sortByCreatedAt(
      state.tasks.filter(task => !task.parentId && task.completed)
    );
  }, [state.tasks]);
  
  // Подзадачи для задачи
  const getSubtasks = (taskId: string) => 
    state.tasks.filter(t => t.parentId === taskId);
  
  // Проверка выполнения привычки сегодня (с защитой от неполных данных)
  const isHabitCompletedToday = (habit: Habit) => {
    const records = Array.isArray(habit.records) ? habit.records : [];
    return records.includes(today);
  };
  
  // Обработчики задач
  const handleToggleTask = (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    const willBeCompleted = task && !task.completed;
    
    dispatch({ type: 'TOGGLE_TASK', payload: id });
    
    if (willBeCompleted) {
      vibrate(50);
      showToast(getRandomMotivation());
    }
  };
  
  const handleDeleteTask = (id: string) => {
    if (confirm('Удалить задачу?')) {
      dispatch({ type: 'DELETE_TASK', payload: id });
    }
  };
  
  const handleSaveTask = (task: Task) => {
    if (editingTask) {
      dispatch({ type: 'UPDATE_TASK', payload: task });
    } else {
      dispatch({ type: 'ADD_TASK', payload: task });
    }
    setShowTaskForm(false);
    setEditingTask(null);
  };
  
  // Обработчики привычек
  const handleToggleHabit = (id: string) => {
    const habit = state.habits.find(h => h.id === id);
    const habitRecords = habit && Array.isArray(habit.records) ? habit.records : [];
    const willBeCompleted = habit && !habitRecords.includes(today);
    
    dispatch({ type: 'TOGGLE_HABIT', payload: { id, date: today } });
    
    if (willBeCompleted) {
      vibrate(50);
      showToast(getRandomMotivation());
    }
  };
  
  const handleDeleteHabit = (id: string) => {
    if (confirm('Удалить привычку?')) {
      dispatch({ type: 'DELETE_HABIT', payload: id });
    }
  };
  
  const handleSaveHabit = (habit: Habit) => {
    if (editingHabit) {
      dispatch({ type: 'UPDATE_HABIT', payload: habit });
    } else {
      dispatch({ type: 'ADD_HABIT', payload: habit });
    }
    setShowHabitModal(false);
    setEditingHabit(null);
  };
  
  const handleBreakdown = (task: Task, subtasks: string[]) => {
    subtasks.forEach(title => {
      dispatch({
        type: 'ADD_TASK',
        payload: {
          id: uuid(),
          title,
          completed: false,
          date: task.date,
          priority: 'normal',
          parentId: task.id,
          createdAt: new Date().toISOString()
        }
      });
    });
    setBreakdownTask(null);
  };
  
  const renderTaskItem = (task: Task, isArchived: boolean = false) => {
    const subtasks = getSubtasks(task.id);
    
    return (
      <div key={task.id} className="task-item-wrapper">
        <div className={`task-item ${task.priority === 'important' ? 'important' : ''} ${isArchived ? 'archived' : ''}`}>
          <Checkbox 
            checked={task.completed} 
            onChange={() => handleToggleTask(task.id)}
          />
          <div className="task-content">
            <span className={task.completed ? 'line-through' : ''}>{task.title}</span>
            {task.timeEstimate && (
              <span className="task-estimate">{task.timeEstimate} мин</span>
            )}
            {task.createdAt && (
              <span className="task-created">
                Добавлено: {formatCreatedAt(task.createdAt)} · {formatDaysAgo(getDaysAgo(task.createdAt))} назад
              </span>
            )}
            {task.completedAt && (
              <span className="task-completed-at">
                Выполнено: {formatCreatedAt(task.completedAt)}
              </span>
            )}
          </div>
          {!isArchived && (
            <div className="task-actions">
              <button 
                className="btn-icon" 
                title="Я застрял"
                onClick={() => setBreakdownTask(task)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </button>
              <button 
                className="btn-icon"
                onClick={() => { setEditingTask(task); setShowTaskForm(true); }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button 
                className="btn-icon text-danger"
                onClick={() => handleDeleteTask(task.id)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          )}
          {isArchived && (
            <button 
              className="btn-icon text-danger"
              onClick={() => handleDeleteTask(task.id)}
              title="Удалить"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          )}
        </div>
        {subtasks.length > 0 && !isArchived && (
          <div className="subtasks">
            {subtasks.map(sub => (
              <div key={sub.id} className="subtask-item">
                <Checkbox 
                  checked={sub.completed} 
                  onChange={() => handleToggleTask(sub.id)}
                  size="sm"
                />
                <span className={sub.completed ? 'line-through' : ''}>{sub.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const hasActiveTasks = groupedTasks.todayTasks.length > 0 || 
                         groupedTasks.weekTasks.length > 0 || 
                         groupedTasks.somedayTasks.length > 0;
  
  return (
    <Layout title="Дела">
      {/* Табы */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'todo' ? 'active' : ''}`}
          onClick={() => setActiveTab('todo')}
        >
          To-Do
        </button>
        <button 
          className={`tab ${activeTab === 'habits' ? 'active' : ''}`}
          onClick={() => setActiveTab('habits')}
        >
          Привычки
        </button>
      </div>
      
      {activeTab === 'todo' ? (
        <div className="todo-content">
          <button 
            className="add-item-btn"
            onClick={() => setShowTaskForm(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Добавить задачу
          </button>
          
          {!hasActiveTasks && archivedTasks.length === 0 ? (
            <EmptyState
              title="Нет задач"
              text="Добавьте первую задачу"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
              }
            />
          ) : (
            <>
              {groupedTasks.todayTasks.length > 0 && (
                <div className="task-group">
                  <h3>Сегодня</h3>
                  <div className="task-list">
                    {groupedTasks.todayTasks.map(task => renderTaskItem(task))}
                  </div>
                </div>
              )}
              
              {groupedTasks.weekTasks.length > 0 && (
                <div className="task-group">
                  <h3>Запланировано</h3>
                  <div className="task-list">
                    {groupedTasks.weekTasks.map(task => renderTaskItem(task))}
                  </div>
                </div>
              )}
              
              {groupedTasks.somedayTasks.length > 0 && (
                <div className="task-group">
                  <h3>Когда-нибудь</h3>
                  <div className="task-list">
                    {groupedTasks.somedayTasks.map(task => renderTaskItem(task))}
                  </div>
                </div>
              )}
              
              {/* Архив задач */}
              {archivedTasks.length > 0 && (
                <div className="archive-section">
                  <button 
                    className="archive-toggle"
                    onClick={() => setShowArchive(!showArchive)}
                  >
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      className={`archive-icon ${showArchive ? 'open' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                    <span>Архив задач</span>
                    <span className="archive-count">{archivedTasks.length}</span>
                  </button>
                  
                  {showArchive && (
                    <div className="archive-list">
                      {archivedTasks.map(task => renderTaskItem(task, true))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="habits-content">
          <button 
            className="add-item-btn"
            onClick={() => { setEditingHabit(null); setShowHabitModal(true); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Добавить привычку
          </button>
          
          {state.habits.length === 0 ? (
            <EmptyState
              title="Нет привычек"
              text="Создайте первую привычку и начните её отслеживать"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              }
            />
          ) : (
            <div className="habits-list">
              {state.habits.map(habit => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  isCompletedToday={isHabitCompletedToday(habit)}
                  onToggle={() => handleToggleHabit(habit.id)}
                  onEdit={() => { setEditingHabit(habit); setShowHabitModal(true); }}
                  onDelete={() => handleDeleteHabit(habit.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Модалки */}
      <Modal 
        isOpen={showTaskForm} 
        onClose={() => { setShowTaskForm(false); setEditingTask(null); }}
        title={editingTask ? 'Редактировать задачу' : 'Новая задача'}
      >
        <TaskForm
          task={editingTask}
          onSave={handleSaveTask}
          onCancel={() => { setShowTaskForm(false); setEditingTask(null); }}
        />
      </Modal>
      
      <CreateHabitModal
        isOpen={showHabitModal}
        onClose={() => { setShowHabitModal(false); setEditingHabit(null); }}
        onSave={handleSaveHabit}
        editingHabit={editingHabit}
      />
      
      {breakdownTask && (
        <BreakdownModal
          task={breakdownTask}
          onSave={handleBreakdown}
          onClose={() => setBreakdownTask(null)}
        />
      )}
    </Layout>
  );
}
