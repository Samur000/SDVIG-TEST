/**
 * Главный контекст приложения СДВиГ
 * 
 * ВАЖНО: С версии 2.0 данные хранятся в IndexedDB
 * При первом запуске выполняется автоматическая миграция из localStorage
 */

import React, { createContext, useContext, useReducer, useEffect, useRef, useState, ReactNode } from 'react';
import { 
  AppState, 
  initialState, 
  Routine, 
  Event, 
  DayTask,
  Wallet, 
  Transaction, 
  Task, 
  Habit, 
  Idea, 
  Profile, 
  Document,
  FocusSession,
  Theme
} from '../types';
import { formatDateLocal } from '../utils/date';
import { initStorage, saveStateAsync } from './storage';

// Флаг для показа модалки обновления (показывается один раз)
const UPDATE_MODAL_SHOWN_FLAG = 'sdvig_v2_update_shown';

// Action Types
type Action =
  // Рутины
  | { type: 'ADD_ROUTINE'; payload: Routine }
  | { type: 'UPDATE_ROUTINE'; payload: Routine }
  | { type: 'DELETE_ROUTINE'; payload: string }
  | { type: 'TOGGLE_ROUTINE'; payload: { id: string; date: string } }
  // События
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'TOGGLE_EVENT'; payload: string }
  | { type: 'MOVE_EVENT_TO_TOMORROW'; payload: string }
  // Задачи дня
  | { type: 'SET_DAY_TASKS'; payload: { date: string; tasks: DayTask[] } }
  | { type: 'TOGGLE_DAY_TASK'; payload: { date: string; taskId: string } }
  | { type: 'UPDATE_DAY_TASK'; payload: { date: string; task: DayTask } }
  | { type: 'DELETE_DAY_TASK'; payload: { date: string; taskId: string } }
  // Финансы
  | { type: 'ADD_WALLET'; payload: Wallet }
  | { type: 'UPDATE_WALLET'; payload: Wallet }
  | { type: 'DELETE_WALLET'; payload: string }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: string }
  // Задачи To-Do
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK'; payload: string }
  // Привычки (HabitKit style)
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'TOGGLE_HABIT'; payload: { id: string; date: string } }
  | { type: 'RECALCULATE_STREAKS' }
  // Инбокс
  | { type: 'ADD_IDEA'; payload: Idea }
  | { type: 'UPDATE_IDEA'; payload: Idea }
  | { type: 'DELETE_IDEA'; payload: string }
  // Профиль
  | { type: 'UPDATE_PROFILE'; payload: Profile }
  // Документы
  | { type: 'ADD_DOCUMENT'; payload: Document }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  // Фокус
  | { type: 'ADD_FOCUS_SESSION'; payload: FocusSession }
  // Настройки
  | { type: 'SET_THEME'; payload: Theme }
  // Общее
  | { type: 'LOAD_STATE'; payload: AppState };

// Вспомогательная функция для расчёта streak
function calculateHabitStreak(records: string[]): number {
  if (records.length === 0) return 0;
  
  const sortedDates = [...records].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayStr = formatDateLocal(today);
  
  // Если сегодня выполнено, начинаем считать с сегодня
  if (sortedDates.includes(todayStr)) {
    // Считаем последовательные дни назад включая сегодня
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let i = 0; i < 365; i++) {
      const dateStr = formatDateLocal(currentDate);
      if (sortedDates.includes(dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Если сегодня выполнено, streak минимум 1 (даже если это первый день)
    return Math.max(streak, 1);
  }
  
  // Если сегодня не выполнено, проверяем вчера
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateLocal(yesterday);
  
  if (!sortedDates.includes(yesterdayStr)) {
    return 0; // Нет streak
  }
  
  // Считаем последовательные дни назад от вчера
  let streak = 0;
  let currentDate = new Date(yesterday);
  
  for (let i = 0; i < 365; i++) {
    const dateStr = formatDateLocal(currentDate);
    if (sortedDates.includes(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // Рутины
    case 'ADD_ROUTINE':
      return { ...state, routines: [...state.routines, action.payload] };
    case 'UPDATE_ROUTINE':
      return {
        ...state,
        routines: state.routines.map(r => r.id === action.payload.id ? action.payload : r)
      };
    case 'DELETE_ROUTINE':
      return { ...state, routines: state.routines.filter(r => r.id !== action.payload) };
    case 'TOGGLE_ROUTINE':
      return {
        ...state,
        routines: state.routines.map(r => {
          if (r.id === action.payload.id) {
            const newCompleted = { ...r.completed };
            newCompleted[action.payload.date] = !newCompleted[action.payload.date];
            return { ...r, completed: newCompleted };
          }
          return r;
        })
      };

    // События
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e => e.id === action.payload.id ? action.payload : e)
      };
    case 'DELETE_EVENT':
      return { ...state, events: state.events.filter(e => e.id !== action.payload) };
    case 'TOGGLE_EVENT':
      return {
        ...state,
        events: state.events.map(e => 
          e.id === action.payload ? { ...e, completed: !e.completed } : e
        )
      };
    case 'MOVE_EVENT_TO_TOMORROW': {
      const event = state.events.find(e => e.id === action.payload);
      if (!event) return state;
      const currentDate = new Date(event.date);
      currentDate.setDate(currentDate.getDate() + 1);
      const newDate = currentDate.toISOString().split('T')[0];
      return {
        ...state,
        events: state.events.map(e => 
          e.id === action.payload ? { ...e, date: newDate } : e
        )
      };
    }

    // Задачи дня
    case 'SET_DAY_TASKS':
      return {
        ...state,
        dayTasks: { ...state.dayTasks, [action.payload.date]: action.payload.tasks }
      };
    case 'TOGGLE_DAY_TASK':
      return {
        ...state,
        dayTasks: {
          ...state.dayTasks,
          [action.payload.date]: (state.dayTasks[action.payload.date] || []).map(t =>
            t.id === action.payload.taskId ? { ...t, completed: !t.completed } : t
          )
        }
      };
    case 'UPDATE_DAY_TASK':
      return {
        ...state,
        dayTasks: {
          ...state.dayTasks,
          [action.payload.date]: (state.dayTasks[action.payload.date] || []).map(t =>
            t.id === action.payload.task.id ? action.payload.task : t
          )
        }
      };
    case 'DELETE_DAY_TASK':
      return {
        ...state,
        dayTasks: {
          ...state.dayTasks,
          [action.payload.date]: (state.dayTasks[action.payload.date] || []).filter(t =>
            t.id !== action.payload.taskId
          )
        }
      };

    // Финансы
    case 'ADD_WALLET':
      return { ...state, wallets: [...state.wallets, action.payload] };
    case 'UPDATE_WALLET':
      return {
        ...state,
        wallets: state.wallets.map(w => w.id === action.payload.id ? action.payload : w)
      };
    case 'DELETE_WALLET':
      return { 
        ...state, 
        wallets: state.wallets.filter(w => w.id !== action.payload),
        transactions: state.transactions.filter(t => t.walletId !== action.payload)
      };
    case 'ADD_TRANSACTION': {
      const wallet = state.wallets.find(w => w.id === action.payload.walletId);
      if (!wallet) return state;
      const balanceChange = action.payload.type === 'income' 
        ? action.payload.amount 
        : -action.payload.amount;
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
        wallets: state.wallets.map(w => 
          w.id === action.payload.walletId 
            ? { ...w, balance: w.balance + balanceChange }
            : w
        )
      };
    }
    case 'DELETE_TRANSACTION': {
      const tx = state.transactions.find(t => t.id === action.payload);
      if (!tx) return state;
      const balanceRevert = tx.type === 'income' ? -tx.amount : tx.amount;
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
        wallets: state.wallets.map(w =>
          w.id === tx.walletId
            ? { ...w, balance: w.balance + balanceRevert }
            : w
        )
      };
    }
    case 'ADD_CATEGORY':
      if (state.categories.includes(action.payload)) return state;
      return { ...state, categories: [...state.categories, action.payload] };

    // Задачи To-Do
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t)
      };
    case 'DELETE_TASK':
      return { 
        ...state, 
        tasks: state.tasks.filter(t => t.id !== action.payload && t.parentId !== action.payload) 
      };
    case 'TOGGLE_TASK': {
      const now = new Date().toISOString();
      
      // Сначала переключаем задачу с записью времени выполнения
      let newTasks = state.tasks.map(t => {
        if (t.id === action.payload) {
          const willBeCompleted = !t.completed;
          return { 
            ...t, 
            completed: willBeCompleted,
            completedAt: willBeCompleted ? now : undefined
          };
        }
        return t;
      });
      
      // Находим задачу которую переключили
      const toggledTask = newTasks.find(t => t.id === action.payload);
      
      // Если это подзадача, проверяем не выполнены ли все подзадачи родителя
      if (toggledTask?.parentId) {
        const siblingSubtasks = newTasks.filter(t => t.parentId === toggledTask.parentId);
        const allSubtasksCompleted = siblingSubtasks.every(t => t.completed);
        
        // Если все подзадачи выполнены - отмечаем родительскую задачу выполненной
        if (allSubtasksCompleted) {
          newTasks = newTasks.map(t =>
            t.id === toggledTask.parentId ? { ...t, completed: true, completedAt: now } : t
          );
        }
      }
      
      return { ...state, tasks: newTasks };
    }

    // Привычки (HabitKit style)
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map(h => h.id === action.payload.id ? action.payload : h)
      };
    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter(h => h.id !== action.payload) };
    case 'TOGGLE_HABIT': {
      const { id, date } = action.payload;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = formatDateLocal(today);
      
      return {
        ...state,
        habits: state.habits.map(h => {
          if (h.id !== id) return h;
          
          // Используем переданную дату или сегодня
          const targetDate = date || todayStr;
          const isCompleted = h.records.includes(targetDate);
          
          if (isCompleted) {
            // Снимаем отметку
            const newRecords = h.records.filter(d => d !== targetDate);
            const newStreak = targetDate === todayStr 
              ? Math.max(0, h.streak - 1)
              : h.streak;
            return { 
              ...h, 
              records: newRecords,
              streak: newStreak
            };
          } else {
            // Добавляем отметку
            const newRecords = [...h.records, targetDate].sort();
            const newStreak = targetDate === todayStr 
              ? h.streak + 1
              : h.streak;
            const newBestStreak = Math.max(h.bestStreak || 0, newStreak);
            return { 
              ...h, 
              records: newRecords,
              streak: newStreak,
              bestStreak: newBestStreak
            };
          }
        })
      };
    }
    case 'RECALCULATE_STREAKS':
      return {
        ...state,
        habits: state.habits.map(h => {
          const streak = calculateHabitStreak(h.records);
          return { ...h, streak, bestStreak: Math.max(h.bestStreak, streak) };
        })
      };

    // Инбокс
    case 'ADD_IDEA':
      return { ...state, ideas: [...state.ideas, action.payload] };
    case 'UPDATE_IDEA':
      return {
        ...state,
        ideas: state.ideas.map(i => i.id === action.payload.id ? action.payload : i)
      };
    case 'DELETE_IDEA':
      return { ...state, ideas: state.ideas.filter(i => i.id !== action.payload) };

    // Профиль
    case 'UPDATE_PROFILE':
      return { ...state, profile: action.payload };

    // Документы
    case 'ADD_DOCUMENT':
      return { ...state, documents: [...state.documents, action.payload] };
    case 'DELETE_DOCUMENT':
      return { ...state, documents: state.documents.filter(d => d.id !== action.payload) };

    // Фокус
    case 'ADD_FOCUS_SESSION':
      return { ...state, focusSessions: [...state.focusSessions, action.payload] };

    // Настройки
    case 'SET_THEME':
      return { ...state, settings: { ...state.settings, theme: action.payload } };

    // Общее
    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Компонент модалки обновления
 */
function UpdateModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'var(--bg, #fff)',
        borderRadius: '16px',
        maxWidth: '400px',
        width: '100%',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease'
      }}>
        {/* Заголовок с градиентом */}
        <div style={{
          background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '8px'
          }}>🚀</div>
          <h2 style={{
            color: 'white',
            fontSize: '22px',
            fontWeight: 700,
            margin: 0
          }}>СДВиГ 2.0</h2>
          <p style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '14px',
            margin: '8px 0 0 0'
          }}>Добро пожаловать в новую версию!</p>
        </div>
        
        {/* Контент */}
        <div style={{
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--accent-soft, #D1FAE5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '16px' }}>💾</span>
            </div>
            <div>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text, #1F2937)',
                margin: '0 0 4px 0'
              }}>Данные перенесены</h3>
              <p style={{
                fontSize: '13px',
                color: 'var(--muted, #6B7280)',
                margin: 0,
                lineHeight: 1.5
              }}>
                Ваши данные успешно перенесены в новое хранилище IndexedDB для повышения надёжности и производительности.
              </p>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--accent-soft, #D1FAE5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '16px' }}>✨</span>
            </div>
            <div>
              <h3 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text, #1F2937)',
                margin: '0 0 4px 0'
              }}>Что нового?</h3>
              <p style={{
                fontSize: '13px',
                color: 'var(--muted, #6B7280)',
                margin: 0,
                lineHeight: 1.5
              }}>
                Улучшенный интерфейс, новые функции и многое другое. Узнайте подробнее о всех изменениях.
              </p>
            </div>
          </div>
          
          {/* Ссылка на страницу обновления */}
          <a
            href="https://samur000.github.io/SDVIG-INFO/changelog/v2.0"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '14px',
              background: 'var(--bg-secondary, #F3F4F6)',
              borderRadius: '10px',
              color: 'var(--accent, #0F766E)',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              marginBottom: '16px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-soft, #D1FAE5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-secondary, #F3F4F6)';
            }}
          >
            <span>Подробнее об обновлении</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
          
          {/* Кнопка закрытия */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 118, 110, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Понятно, начать работу
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  // Ref для отслеживания, нужно ли сохранять
  const isInitialMount = useRef(true);
  // Ref для debounce сохранения
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ============ Загрузка данных при старте (из IndexedDB) ============
  useEffect(() => {
    async function loadData() {
      try {
        console.log('AppContext: инициализация хранилища...');
        
        // initStorage выполняет:
        // 1. Открытие IndexedDB
        // 2. Миграцию из localStorage (если нужно)
        // 3. Загрузку данных
        const loadedState = await initStorage();
        
        // Обеспечиваем совместимость со старыми данными
        const withDefaults: AppState = {
          ...loadedState,
          settings: loadedState.settings || initialState.settings
        };
        
        dispatch({ type: 'LOAD_STATE', payload: withDefaults });
        setIsLoaded(true);
        
        // Проверяем, нужно ли показать модалку обновления
        const updateModalShown = localStorage.getItem(UPDATE_MODAL_SHOWN_FLAG);
        if (!updateModalShown) {
          setShowUpdateModal(true);
        }
        
        console.log('AppContext: данные успешно загружены');
      } catch (error) {
        console.error('AppContext: ошибка загрузки данных:', error);
        setLoadError('Ошибка загрузки данных. Попробуйте обновить страницу.');
        // Даже при ошибке показываем приложение с начальным состоянием
        setIsLoaded(true);
      }
    }
    
    loadData();
  }, []);

  // ============ Сохранение данных при изменениях (в IndexedDB) ============
  useEffect(() => {
    // Пропускаем первый рендер и рендер до загрузки
    if (isInitialMount.current || !isLoaded) {
      isInitialMount.current = false;
      return;
    }

    // Debounce сохранения для избежания частых записей
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveStateAsync(state);
        // Сохранение успешно - не логируем каждый раз
      } catch (error) {
        console.error('AppContext: ошибка сохранения:', error);
      }
    }, 300); // 300ms debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, isLoaded]);

  // ============ Применение темы ============
  useEffect(() => {
    const theme = state.settings?.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, [state.settings?.theme]);

  // ============ Закрытие модалки обновления ============
  const handleCloseUpdateModal = () => {
    localStorage.setItem(UPDATE_MODAL_SHOWN_FLAG, 'true');
    setShowUpdateModal(false);
  };

  // ============ Экран загрузки ============
  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'system-ui',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #E5E7EB',
          borderTopColor: '#0F766E',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ color: '#6B7280' }}>Загрузка...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ============ Экран ошибки ============
  if (loadError) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        fontFamily: 'system-ui',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '48px',
          marginBottom: '16px'
        }}>⚠️</div>
        <p style={{ 
          color: '#DC2626',
          marginBottom: '16px'
        }}>{loadError}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: '#0F766E',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Обновить страницу
        </button>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
      {showUpdateModal && <UpdateModal onClose={handleCloseUpdateModal} />}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
