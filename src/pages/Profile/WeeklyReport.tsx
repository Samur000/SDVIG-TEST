import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { formatDate, getToday } from '../../utils/date';
import { Modal } from '../../components/Modal';
import { TaskForm } from '../Tasks/TaskForm';
import { CreateHabitModal } from '../Tasks/habits/CreateHabitModal';
import { Task, Habit, Currency, CURRENCY_SYMBOLS } from '../../types';
import './WeeklyReport.css';

// Компонент Sparkline (мини-график из 7 точек)
const Sparkline: React.FC<{ data: number[]; color: string; animate?: boolean }> = ({ data, color, animate = true }) => {
  const [animated, setAnimated] = useState(!animate);
  
  useEffect(() => {
    if (animate) {
      const timeout = setTimeout(() => setAnimated(true), 100);
      return () => clearTimeout(timeout);
    }
  }, [animate]);
  
  const maxVal = Math.max(...data, 1);
  const width = 100;
  const height = 40;
  const padding = 4;
  
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (val / maxVal) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  
  const areaPath = `M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`;
  
  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className={`sparkline ${animated ? 'animated' : ''}`}
      style={{ '--sparkline-color': color } as React.CSSProperties}
    >
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path 
        d={areaPath} 
        fill={`url(#gradient-${color.replace('#', '')})`}
        className="sparkline-area"
      />
      <polyline 
        points={points} 
        fill="none" 
        stroke={color} 
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="sparkline-line"
      />
    </svg>
  );
};

// Компонент Progress Ring
const ProgressRing: React.FC<{ 
  percent: number; 
  color: string; 
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
}> = ({ percent, color, size = 60, strokeWidth = 5, animate = true }) => {
  const [animatedPercent, setAnimatedPercent] = useState(animate ? 0 : percent);
  
  useEffect(() => {
    if (animate) {
      const timeout = setTimeout(() => setAnimatedPercent(percent), 100);
      return () => clearTimeout(timeout);
    } else {
      setAnimatedPercent(percent);
    }
  }, [percent, animate]);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedPercent / 100) * circumference;
  
  return (
    <svg 
      width={size} 
      height={size} 
      className="progress-ring"
      style={{ '--ring-color': color } as React.CSSProperties}
    >
      <circle
        className="progress-ring-bg"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="progress-ring-progress"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: offset,
          stroke: color
        }}
      />
    </svg>
  );
};

export function WeeklyReport() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  
  // States
  const [financeMode, setFinanceMode] = useState<'balance' | 'income' | 'expense'>('balance');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isFinanceAnimating, setIsFinanceAnimating] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showHabitsQuick, setShowHabitsQuick] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  const financeCardRef = useRef<HTMLDivElement>(null);
  
  // Fallbacks
  const wallets = state.wallets ?? [];
  const transactions = state.transactions ?? [];
  const tasks = state.tasks ?? [];
  const habits = state.habits ?? [];
  const focusSessions = state.focusSessions ?? [];
  
  // Load animation
  useEffect(() => {
    const timeout = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(timeout);
  }, []);
  
  // Финансовые данные за неделю (по валютам)
  const financeData = useMemo(() => {
    const today = new Date();
    
    // Группируем балансы по валютам
    const balancesByCurrency: Record<Currency, number> = {} as Record<Currency, number>;
    wallets.forEach(w => {
      const currency = w.currency || 'RUB';
      balancesByCurrency[currency] = (balancesByCurrency[currency] || 0) + (w.balance || 0);
    });
    
    // Группируем доходы и расходы по валютам за неделю
    const incomeByCurrency: Record<Currency, number> = {} as Record<Currency, number>;
    const expenseByCurrency: Record<Currency, number> = {} as Record<Currency, number>;
    
    // Данные для спарклайна (по дням, только для первой валюты или RUB)
    const weekData: number[] = [];
    const primaryCurrency = Object.keys(balancesByCurrency).find(c => balancesByCurrency[c as Currency] !== 0) as Currency || 'RUB';
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      
      const dayTransactions = transactions.filter(t => t.date === dateStr);
      let dayBalance = 0;
      
      dayTransactions.forEach(t => {
        const wallet = wallets.find(w => w.id === t.walletId);
        if (!wallet) return;
        
        const currency = wallet.currency || 'RUB';
        
        if (t.type === 'income') {
          incomeByCurrency[currency] = (incomeByCurrency[currency] || 0) + t.amount;
          if (currency === primaryCurrency) {
            dayBalance += t.amount;
          }
        } else if (t.type === 'expense') {
          expenseByCurrency[currency] = (expenseByCurrency[currency] || 0) + t.amount;
          if (currency === primaryCurrency) {
            dayBalance -= t.amount;
          }
        } else if (t.type === 'transfer') {
          // Переводы не влияют на общий баланс, но влияют на спарклайн
          if (currency === primaryCurrency) {
            // Для спарклайна не учитываем переводы
          }
        }
      });
      
      weekData.push(dayBalance);
    }
    
    // Вычисляем изменения за неделю по валютам
    const weekChangeByCurrency: Record<Currency, number> = {} as Record<Currency, number>;
    Object.keys(incomeByCurrency).forEach(currency => {
      weekChangeByCurrency[currency as Currency] = (incomeByCurrency[currency as Currency] || 0) - (expenseByCurrency[currency as Currency] || 0);
    });
    Object.keys(expenseByCurrency).forEach(currency => {
      if (!weekChangeByCurrency[currency as Currency]) {
        weekChangeByCurrency[currency as Currency] = -(expenseByCurrency[currency as Currency] || 0);
      }
    });
    
    return {
      balancesByCurrency,
      incomeByCurrency,
      expenseByCurrency,
      weekChangeByCurrency,
      sparklineBalance: weekData.map((_, i, arr) => arr.slice(0, i + 1).reduce((a, b) => a + b, 0)),
      sparklineIncome: weekData.map(d => d > 0 ? d : 0),
      sparklineExpense: weekData.map(d => d < 0 ? Math.abs(d) : 0),
    };
  }, [wallets, transactions]);
  
  // Статистика задач
  const tasksData = useMemo(() => {
    const today = getToday();
    const rootTasks = tasks.filter(t => !t.parentId);
    
    // Активные задачи: на сегодня ИЛИ без даты (когда-нибудь) ИЛИ просроченные
    const activeTasks = rootTasks.filter(t => {
      if (!t.date) return true; // Без даты - "Когда-нибудь"
      return t.date <= today; // На сегодня или просроченные
    });
    
    const completed = activeTasks.filter(t => t.completed).length;
    const total = activeTasks.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Данные за неделю (выполненные задачи по дням)
    const todayDate = new Date();
    const weekData: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(todayDate);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      
      // Считаем задачи выполненные в этот день (по completedAt)
      const dayCompleted = rootTasks.filter(t => {
        if (!t.completed) return false;
        if (t.completedAt) {
          return t.completedAt.startsWith(dateStr);
        }
        // Fallback: если нет completedAt, смотрим по date
        return t.date === dateStr;
      }).length;
      
      weekData.push(dayCompleted);
    }
    
    return { completed, total, percent, weekData };
  }, [tasks]);
  
  // Статистика привычек
  const habitsData = useMemo(() => {
    const today = getToday();
    const todayCompleted = habits.filter(h => h.records.includes(today)).length;
    const total = habits.length;
    const percent = total > 0 ? Math.round((todayCompleted / total) * 100) : 0;
    
    // Данные за неделю
    const weekData: number[] = [];
    const todayDate = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(todayDate);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const dayCompleted = habits.filter(h => h.records.includes(dateStr)).length;
      weekData.push(dayCompleted);
    }
    
    return { completed: todayCompleted, total, percent, weekData };
  }, [habits]);
  
  // Статистика фокуса
  const focusData = useMemo(() => {
    const today = getToday();
    const todaySessions = focusSessions.filter(s => s.date?.split('T')[0] === today);
    const todayMinutes = Math.floor(todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60);
    
    // Данные за неделю
    const weekData: number[] = [];
    const todayDate = new Date();
    let weekTotal = 0;
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(todayDate);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const daySessions = focusSessions.filter(s => s.date?.split('T')[0] === dateStr);
      const dayMinutes = daySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;
      weekData.push(dayMinutes);
      weekTotal += dayMinutes;
    }
    
    const hours = Math.floor(weekTotal / 60);
    const minutes = Math.round(weekTotal % 60);
    
    return { 
      todayMinutes, 
      weekTotal,
      hours,
      minutes,
      percent: Math.min(100, Math.round((todayMinutes / 120) * 100)), // 2 часа = 100%
      weekData 
    };
  }, [focusSessions]);
  
  // Инсайт
  const insight = useMemo(() => {
    const todayDate = new Date();
    const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    
    let bestDay = -1;
    let bestCount = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(todayDate);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);
      const dayTasks = tasks.filter(t => t.date === dateStr && t.completed && !t.parentId);
      if (dayTasks.length > bestCount) {
        bestCount = dayTasks.length;
        bestDay = date.getDay();
      }
    }
    
    if (bestCount >= 3) {
      return `🏆 Лучший день: ${days[bestDay]} (${bestCount} задач)`;
    } else if (tasksData.completed > 0) {
      return `✨ Так держать! Уже ${tasksData.completed} задач сегодня`;
    } else if (habitsData.completed > 0) {
      return `🌟 ${habitsData.completed} привычек выполнено сегодня`;
    }
    return null;
  }, [tasks, tasksData, habitsData]);
  
  // Форматирование денег
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Свайп финансовой карточки
  const touchStartY = useRef<number | null>(null);
  const isHorizontalSwipe = useRef(false);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null || touchStartY.current === null) return;
    
    const diffX = Math.abs(touchStart - e.touches[0].clientX);
    const diffY = Math.abs(touchStartY.current - e.touches[0].clientY);
    
    // Если горизонтальное движение больше вертикального, это горизонтальный свайп
    if (diffX > diffY && diffX > 10) {
      isHorizontalSwipe.current = true;
      // Предотвращаем вертикальную прокрутку
      e.preventDefault();
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const diff = touchStart - e.changedTouches[0].clientX;
    const threshold = 50;
    
    // Обрабатываем только если это был горизонтальный свайп
    if (isHorizontalSwipe.current && Math.abs(diff) > threshold) {
      switchFinanceMode(diff > 0 ? 'next' : 'prev');
    }
    
    setTouchStart(null);
    touchStartY.current = null;
    isHorizontalSwipe.current = false;
  };
  
  const switchFinanceMode = (direction: 'next' | 'prev') => {
    setIsFinanceAnimating(true);
    setTimeout(() => {
      if (direction === 'next') {
        setFinanceMode(prev => 
          prev === 'balance' ? 'income' : prev === 'income' ? 'expense' : 'balance'
        );
      } else {
        setFinanceMode(prev => 
          prev === 'balance' ? 'expense' : prev === 'expense' ? 'income' : 'balance'
        );
      }
      setTimeout(() => setIsFinanceAnimating(false), 200);
    }, 100);
  };
  
  const handleDotClick = (mode: 'balance' | 'income' | 'expense', e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode !== financeMode) {
      setIsFinanceAnimating(true);
      setTimeout(() => {
        setFinanceMode(mode);
        setTimeout(() => setIsFinanceAnimating(false), 200);
      }, 100);
    }
  };
  
  // Получить данные для текущего режима финансов
  const getFinanceDisplay = () => {
    switch (financeMode) {
      case 'balance':
        return {
          label: 'Баланс',
          valuesByCurrency: financeData.balancesByCurrency,
          changeByCurrency: financeData.weekChangeByCurrency,
          sparkline: financeData.sparklineBalance,
          color: '#2186b4'
        };
      case 'income':
        return {
          label: 'Доход',
          valuesByCurrency: financeData.incomeByCurrency,
          changeByCurrency: financeData.incomeByCurrency,
          sparkline: financeData.sparklineIncome,
          color: '#22c55e'
        };
      case 'expense':
        return {
          label: 'Расход',
          valuesByCurrency: financeData.expenseByCurrency,
          changeByCurrency: Object.fromEntries(
            Object.entries(financeData.expenseByCurrency).map(([curr, val]) => [curr, -val])
          ) as Record<Currency, number>,
          sparkline: financeData.sparklineExpense,
          color: '#ef4444'
        };
    }
  };
  
  const financeDisplay = getFinanceDisplay();
  
  // Получить список валют с ненулевыми значениями
  const getActiveCurrencies = (values: Record<Currency, number>): Currency[] => {
    return Object.entries(values)
      .filter(([_, value]) => Math.abs(value) > 0.01)
      .map(([currency]) => currency as Currency)
      .sort((a, b) => {
        // Сортируем: сначала RUB, потом остальные по алфавиту
        if (a === 'RUB') return -1;
        if (b === 'RUB') return 1;
        return a.localeCompare(b);
      });
  };
  
  // Сохранение задачи
  const handleSaveTask = (task: Task) => {
    dispatch({ type: 'ADD_TASK', payload: task });
    setShowTaskForm(false);
  };
  
  // Сохранение привычки
  const handleSaveHabit = (habit: Habit) => {
    dispatch({ type: 'ADD_HABIT', payload: habit });
    setShowHabitForm(false);
  };
  
  // Переключение привычки
  const handleToggleHabit = (habitId: string) => {
    dispatch({ type: 'TOGGLE_HABIT', payload: { id: habitId, date: getToday() } });
  };
  
  return (
    <div className="weekly-report">
      {/* Финансовый блок */}
      <div 
        ref={financeCardRef}
        className={`finance-card ${loaded ? 'loaded' : ''} ${isFinanceAnimating ? 'animating' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="finance-content">
          
          <div className="finance-info" onClick={() => navigate('/finance')}>
            <span className="finance-label">{financeDisplay.label}</span>
            <div className="finance-values">
              {(() => {
                const activeCurrencies = getActiveCurrencies(financeDisplay.valuesByCurrency);
                if (activeCurrencies.length > 0) {
                  return activeCurrencies.map(currency => {
                    const value = financeDisplay.valuesByCurrency[currency] || 0;
                    const change = financeDisplay.changeByCurrency[currency] || 0;
                    return (
                      <div key={currency} className="finance-currency-row">
                        <span className={`finance-value ${financeMode}`}>
                          {formatMoney(value)} {CURRENCY_SYMBOLS[currency]}
                        </span>
                        {Math.abs(change) > 0.01 && (
                          <span className={`finance-change ${change >= 0 ? 'positive' : 'negative'}`}>
                            {change >= 0 ? '↑' : '↓'} {change >= 0 ? '+' : ''}{formatMoney(Math.abs(change))} {CURRENCY_SYMBOLS[currency]} за неделю
                          </span>
                        )}
                      </div>
                    );
                  });
                } else {
                  return (
                    <span className={`finance-value ${financeMode}`}>
                      0 ₽
                    </span>
                  );
                }
              })()}
            </div>
          </div>
        
        </div>
        <div className="finance-dots">
          <button 
            className={`dot ${financeMode === 'balance' ? 'active' : ''}`} 
            onClick={(e) => handleDotClick('balance', e)}
          />
          <button 
            className={`dot ${financeMode === 'income' ? 'active' : ''}`} 
            onClick={(e) => handleDotClick('income', e)}
          />
          <button 
            className={`dot ${financeMode === 'expense' ? 'active' : ''}`} 
            onClick={(e) => handleDotClick('expense', e)}
          />
        </div>
      </div>
      
      {/* Ринг-карточки */}
      <div className="ring-cards-scroll">
        <div className="ring-cards">
          {/* Задачи */}
          <div className="ring-card" onClick={() => setShowTaskForm(true)}>
            <div className="ring-container">
              <ProgressRing percent={tasksData.percent} color="#2186b4" animate={loaded} />
              <div className="ring-icon" style={{ color: '#2186b4' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
              </div>
            </div>
            <span className="ring-value">{tasksData.completed}/{tasksData.total || 1}</span>
            <span className="ring-label">Задачи</span>
            <div className="ring-sparkline">
              <Sparkline data={tasksData.weekData} color="#2186b4" animate={loaded} />
            </div>
          </div>
          
          {/* Привычки */}
          <div className="ring-card" onClick={() => setShowHabitsQuick(true)}>
            <div className="ring-container">
              <ProgressRing percent={habitsData.percent} color="#22c55e" animate={loaded} />
              <div className="ring-icon" style={{ color: '#22c55e' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                </svg>
              </div>
            </div>
            <span className="ring-value">{habitsData.percent}%</span>
            <span className="ring-label">Привычки</span>
            <div className="ring-sparkline">
              <Sparkline data={habitsData.weekData} color="#22c55e" animate={loaded} />
            </div>
          </div>
          
          {/* Фокус */}
          <div className="ring-card" onClick={() => navigate('/focus')}>
            <div className="ring-container">
              <ProgressRing percent={focusData.percent} color="#ea580c" animate={loaded} />
              <div className="ring-icon" style={{ color: '#ea580c' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <span className="ring-value">
              {focusData.hours > 0 ? `${focusData.hours}ч` : `${focusData.todayMinutes}м`}
            </span>
            <span className="ring-label">Фокус</span>
            <div className="ring-sparkline">
              <Sparkline data={focusData.weekData} color="#ea580c" animate={loaded} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Быстрые действия */}
      <div className="quick-actions">
        <button className="quick-action-btn" onClick={() => setShowTaskForm(true)}>
          <div className="quick-action-icon tasks">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span className="quick-action-text">Задачу</span>
        </button>
        
        <button className="quick-action-btn" onClick={() => setShowHabitForm(true)}>
          <div className="quick-action-icon habits">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span className="quick-action-text">Привычку</span>
        </button>
        
        <button className="quick-action-btn" onClick={() => navigate('/focus')}>
          <div className="quick-action-icon focus">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
          <span className="quick-action-text">Таймер</span>
        </button>
      </div>
      
      {/* Инсайт */}
      {insight && (
        <div className="insight-block">
          <span>{insight}</span>
        </div>
      )}
      
      {/* Модалки */}
      <Modal
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        title="Новая задача"
      >
        <TaskForm
          task={null}
          onSave={handleSaveTask}
          onCancel={() => setShowTaskForm(false)}
        />
      </Modal>
      
      <CreateHabitModal
        isOpen={showHabitForm}
        onClose={() => setShowHabitForm(false)}
        onSave={handleSaveHabit}
        editingHabit={null}
      />
      
      {/* Быстрый список привычек */}
      <Modal
        isOpen={showHabitsQuick}
        onClose={() => setShowHabitsQuick(false)}
        title="Привычки на сегодня"
      >
        <div className="habits-quick-list">
          {habits.length === 0 ? (
            <p className="habits-empty">Нет привычек. Добавьте первую!</p>
          ) : (
            habits.map(habit => {
              const isCompleted = habit.records.includes(getToday());
              return (
                <label key={habit.id} className="habit-quick-item">
                  <input 
                    type="checkbox" 
                    checked={isCompleted}
                    onChange={() => handleToggleHabit(habit.id)}
                  />
                  <span className={isCompleted ? 'completed' : ''}>{habit.title}</span>
                </label>
              );
            })
          )}
          <button 
            className="btn btn-primary filled"
            onClick={() => { setShowHabitsQuick(false); setShowHabitForm(true); }}
            style={{ marginTop: 16 }}
          >
            + Добавить привычку
          </button>
        </div>
      </Modal>
    </div>
  );
}

