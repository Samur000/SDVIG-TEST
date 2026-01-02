import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { useApp } from '../../store/AppContext';
import { saveStateAsync } from '../../store/storage';
import { TimerMode } from '../../types';
import { v4 as uuid } from 'uuid';
import './FocusPage.css';

interface PomodoroSettings {
  focusDuration: number;      // в минутах
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
};

const PRESETS = [
  { label: '15', value: 15 },
  { label: '25', value: 25 },
  { label: '45', value: 45 },
  { label: '60', value: 60 },
];

export function FocusPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  
  // Настройки
  const [settings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  
  // Считаем сессии за сегодня из сохранённых данных
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessionsCount = (state.focusSessions || [])
    .filter(s => s.date?.startsWith(todayStr) && s.completed)
    .length;
  
  // Восстанавливаем состояние таймера из глобального state
  const savedTimer = state.timerState;
  
  // Локальное состояние таймера (инициализируется из глобального)
  const [mode, setMode] = useState<TimerMode>(savedTimer?.mode || 'focus');
  const [timeLeft, setTimeLeft] = useState(() => {
    if (savedTimer?.isRunning && savedTimer.startedAt) {
      // Вычисляем сколько времени прошло с момента старта
      const elapsed = Math.floor((Date.now() - savedTimer.startedAt) / 1000);
      const remaining = Math.max(0, savedTimer.timeLeft - elapsed);
      return remaining;
    }
    return savedTimer?.timeLeft || settings.focusDuration * 60;
  });
  const [isRunning, setIsRunning] = useState(savedTimer?.isRunning || false);
  const [sessionsCompleted, setSessionsCompleted] = useState(savedTimer?.sessionsCompleted ?? todaySessionsCount);
  const [currentTask, setCurrentTask] = useState(savedTimer?.currentTask || '');
  const [focusDuration, setFocusDuration] = useState(savedTimer?.focusDuration || settings.focusDuration);
  
  // Режим минималистичного отображения (скрытие элементов)
  const [showExtras, setShowExtras] = useState(!isRunning);
  
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(savedTimer?.startedAt || 0);
  const sessionSavedRef = useRef(false);
  
  // Refs для актуальных значений при сохранении
  const modeRef = useRef(mode);
  const timeLeftRef = useRef(timeLeft);
  const currentTaskRef = useRef(currentTask);
  const stateRef = useRef(state);
  const isRunningRef = useRef(isRunning);
  
  // Синхронизация refs
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { currentTaskRef.current = currentTask; }, [currentTask]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  
  // Получаем длительность для текущего режима
  const getDuration = useCallback((m: TimerMode) => {
    switch (m) {
      case 'focus': return focusDuration * 60;
      case 'shortBreak': return settings.shortBreakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
    }
  }, [settings, focusDuration]);
  
  // Форматирование времени
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Прогресс (0-100)
  const totalDuration = getDuration(mode);
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
  
  // Цвет режима
  const getModeColor = () => {
    switch (mode) {
      case 'focus': return '#ea580c';
      case 'shortBreak': return '#22c55e';
      case 'longBreak': return '#2186b4';
    }
  };
  
  // Название режима
  const getModeName = () => {
    switch (mode) {
      case 'focus': return 'Фокус';
      case 'shortBreak': return 'Короткий перерыв';
      case 'longBreak': return 'Длинный перерыв';
    }
  };
  
  // Воспроизведение звука
  const playSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 200);
      
      setTimeout(() => playSound(), 300);
    } catch (e) {
      // Звук не поддерживается
    }
  }, []);
  
  // Сохранение состояния таймера в глобальный state
  const saveTimerState = useCallback((running: boolean, startedAt?: number) => {
    const timerState = {
      mode: modeRef.current,
      timeLeft: timeLeftRef.current,
      isRunning: running,
      sessionsCompleted,
      currentTask: currentTaskRef.current,
      focusDuration,
      startedAt: startedAt || startTimeRef.current
    };
    
    dispatch({ type: 'UPDATE_TIMER_STATE', payload: timerState });
  }, [dispatch, sessionsCompleted, focusDuration]);
  
  // Старт таймера
  const handleStart = useCallback(() => {
    setIsRunning(true);
    setShowExtras(false);
    const now = Date.now();
    startTimeRef.current = now;
    sessionSavedRef.current = false;
    saveTimerState(true, now);
  }, [saveTimerState]);
  
  // Пауза
  const handlePause = useCallback(() => {
    setIsRunning(false);
    setShowExtras(true);
    saveTimerState(false);
  }, [saveTimerState]);
  
  // Сброс
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setShowExtras(true);
    setTimeLeft(getDuration(mode));
    sessionSavedRef.current = false;
    dispatch({ type: 'UPDATE_TIMER_STATE', payload: undefined });
  }, [getDuration, mode, dispatch]);
  
  // Сохранение текущей сессии
  const saveCurrentSession = useCallback((completed: boolean = false) => {
    if (mode !== 'focus' || sessionSavedRef.current) return;
    
    const elapsed = getDuration(mode) - timeLeft;
    if (elapsed >= 10) {
      sessionSavedRef.current = true;
      
      const newSession = {
        id: uuid(),
        taskId: '',
        taskTitle: currentTask || 'Фокус-сессия',
        duration: elapsed,
        date: new Date().toISOString(),
        completed
      };
      
      dispatch({
        type: 'ADD_FOCUS_SESSION',
        payload: newSession
      });
      
      const currentState = stateRef.current;
      const updatedState = { 
        ...currentState, 
        focusSessions: [...(currentState.focusSessions || []), newSession] 
      };
      saveStateAsync(updatedState).catch(console.error);
      stateRef.current = updatedState;
    }
  }, [mode, getDuration, timeLeft, currentTask, dispatch]);
  
  // Сохранение при закрытии страницы или уходе
  useEffect(() => {
    const saveSessionDirect = () => {
      if (modeRef.current !== 'focus' || sessionSavedRef.current) return;
      
      const duration = getDuration('focus');
      const elapsed = duration - timeLeftRef.current;
      if (elapsed >= 10) {
        sessionSavedRef.current = true;
        
        const newSession = {
          id: uuid(),
          taskId: '',
          taskTitle: currentTaskRef.current || 'Фокус-сессия',
          duration: elapsed,
          date: new Date().toISOString(),
          completed: false
        };
        
        dispatch({
          type: 'ADD_FOCUS_SESSION',
          payload: newSession
        });
        
        const currentState = stateRef.current;
        const updatedState = { 
          ...currentState, 
          focusSessions: [...(currentState.focusSessions || []), newSession] 
        };
        saveStateAsync(updatedState).catch(console.error);
      }
    };
    
    const handleBeforeUnload = () => {
      saveSessionDirect();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // При уходе со страницы - сохраняем состояние таймера
      if (isRunningRef.current) {
        const timerState = {
          mode: modeRef.current,
          timeLeft: timeLeftRef.current,
          isRunning: true,
          sessionsCompleted,
          currentTask: currentTaskRef.current,
          focusDuration,
          startedAt: startTimeRef.current
        };
        dispatch({ type: 'UPDATE_TIMER_STATE', payload: timerState });
      }
    };
  }, [getDuration, dispatch, sessionsCompleted, focusDuration]);
  
  // Пропустить (перейти к следующему режиму)
  const handleSkip = useCallback(() => {
    setIsRunning(false);
    setShowExtras(true);
    
    if (mode === 'focus') {
      saveCurrentSession(false);
      
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      
      setTimeout(() => {
        sessionSavedRef.current = false;
        if (newSessions % settings.sessionsUntilLongBreak === 0) {
          setMode('longBreak');
          setTimeLeft(getDuration('longBreak'));
        } else {
          setMode('shortBreak');
          setTimeLeft(getDuration('shortBreak'));
        }
        dispatch({ type: 'UPDATE_TIMER_STATE', payload: undefined });
      }, 100);
    } else {
      sessionSavedRef.current = false;
      setMode('focus');
      setTimeLeft(getDuration('focus'));
      dispatch({ type: 'UPDATE_TIMER_STATE', payload: undefined });
    }
  }, [mode, getDuration, sessionsCompleted, settings.sessionsUntilLongBreak, saveCurrentSession, dispatch]);
  
  // Завершение таймера
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    setShowExtras(true);
    playSound();
    
    if (mode === 'focus') {
      const newSession = {
        id: uuid(),
        taskId: '',
        taskTitle: currentTask || 'Фокус-сессия',
        duration: getDuration(mode),
        date: new Date().toISOString(),
        completed: true
      };
      
      dispatch({
        type: 'ADD_FOCUS_SESSION',
        payload: newSession
      });
      
      const currentState = stateRef.current;
      const updatedState = { 
        ...currentState, 
        focusSessions: [...(currentState.focusSessions || []), newSession] 
      };
      saveStateAsync(updatedState).catch(console.error);
      stateRef.current = updatedState;
      
      sessionSavedRef.current = true;
      
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      
      setTimeout(() => {
        sessionSavedRef.current = false;
        if (newSessions % settings.sessionsUntilLongBreak === 0) {
          setMode('longBreak');
          setTimeLeft(getDuration('longBreak'));
        } else {
          setMode('shortBreak');
          setTimeLeft(getDuration('shortBreak'));
        }
        dispatch({ type: 'UPDATE_TIMER_STATE', payload: undefined });
      }, 100);
    } else {
      setMode('focus');
      setTimeLeft(getDuration('focus'));
      dispatch({ type: 'UPDATE_TIMER_STATE', payload: undefined });
    }
  }, [mode, sessionsCompleted, settings.sessionsUntilLongBreak, getDuration, dispatch, currentTask, playSound]);
  
  // Изменение длительности фокуса
  const handleSetFocusDuration = useCallback((minutes: number) => {
    if (!isRunning && mode === 'focus') {
      setFocusDuration(minutes);
      setTimeLeft(minutes * 60);
    }
  }, [isRunning, mode]);
  
  // Переключение режима вручную
  const handleSetMode = useCallback((newMode: TimerMode) => {
    if (!isRunning) {
      setMode(newMode);
      if (newMode === 'focus') {
        setTimeLeft(focusDuration * 60);
      } else {
        setTimeLeft(getDuration(newMode));
      }
    }
  }, [isRunning, getDuration, focusDuration]);
  
  // Обработка свайпа для показа/скрытия элементов
  const touchStartY = useRef(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isRunning) return;
    
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    
    if (Math.abs(deltaY) > 50) {
      setShowExtras(deltaY < 0); // свайп вниз - показать, вверх - скрыть
    }
  };
  
  // Тик таймера
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, handleTimerComplete]);
  
  // Обновление title страницы
  useEffect(() => {
    if (isRunning) {
      document.title = `${formatTime(timeLeft)} - ${getModeName()}`;
    } else {
      document.title = 'СДВИГ';
    }
    
    return () => {
      document.title = 'СДВИГ';
    };
  }, [timeLeft, isRunning, mode]);
  
  // SVG параметры для кольца
  const size = 196;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <Layout 
      title="Помодоро"
      headerRight={
        <button 
          className="header-back-btn"
          onClick={() => navigate(-1)}
        >
          Назад
        </button>
      }
    >
      <div 
        className={`focus-page ${isRunning && !showExtras ? 'minimal' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Режимы */}
        {(!isRunning || showExtras) && (
          <div className="focus-modes">
            <button 
              className={`focus-mode-btn ${mode === 'focus' ? 'active' : ''}`}
              onClick={() => handleSetMode('focus')}
              disabled={isRunning}
            >
              Фокус
            </button>
            <button 
              className={`focus-mode-btn ${mode === 'shortBreak' ? 'active' : ''}`}
              onClick={() => handleSetMode('shortBreak')}
              disabled={isRunning}
            >
              Перерыв
            </button>
            <button 
              className={`focus-mode-btn ${mode === 'longBreak' ? 'active' : ''}`}
              onClick={() => handleSetMode('longBreak')}
              disabled={isRunning}
            >
              Длинный
            </button>
          </div>
        )}
        
        {/* Таймер */}
        <div className="focus-timer-container">
          <svg 
            className="focus-timer-ring" 
            width={size} 
            height={size}
            style={{ '--ring-color': getModeColor() } as React.CSSProperties}
          >
            <circle
              className="focus-timer-bg"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              className="focus-timer-progress"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ stroke: getModeColor() }}
            />
          </svg>
          
          <div className="focus-timer-display">
            <span className="focus-timer-time" style={{ color: getModeColor() }}>
              {formatTime(timeLeft)}
            </span>
            <span className="focus-timer-mode">{getModeName()}</span>
            {currentTask && isRunning && !showExtras && (
              <span className="focus-timer-task">{currentTask}</span>
            )}
          </div>
        </div>
        
        {/* Пресеты (только для фокуса и не во время работы) */}
        {mode === 'focus' && (!isRunning || showExtras) && !isRunning && (
          <div className="focus-presets">
            {PRESETS.map(preset => (
              <button
                key={preset.value}
                className={`focus-preset-btn ${focusDuration === preset.value ? 'active' : ''}`}
                onClick={() => handleSetFocusDuration(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
        
        {/* Задача */}
        {mode === 'focus' && (!isRunning || showExtras) && !isRunning && (
          <div className="focus-task-input">
            <input
              type="text"
              value={currentTask}
              onChange={e => setCurrentTask(e.target.value)}
              placeholder="Над чем работаем?"
              className="focus-task-field"
            />
          </div>
        )}
        
        {/* Управление */}
        <div className="focus-controls">
          {!isRunning ? (
            <button 
              className="focus-control-btn primary"
              onClick={handleStart}
              style={{ backgroundColor: getModeColor() }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>Старт</span>
            </button>
          ) : (
            <button 
              className="focus-control-btn primary"
              onClick={handlePause}
              style={{ backgroundColor: getModeColor() }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
              <span>Пауза</span>
            </button>
          )}
          
          <button className="focus-control-btn secondary" onClick={handleReset}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6"/>
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
            </svg>
          </button>
          
          <button className="focus-control-btn secondary" onClick={handleSkip}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 4 15 12 5 20 5 4"/>
              <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
        
        {/* Счётчик сессий */}
        {(!isRunning || showExtras) && (
          <div className="focus-sessions">
            <span className="focus-sessions-label">Сессий сегодня:</span>
            <div className="focus-sessions-dots">
              {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, i) => (
                <span 
                  key={i} 
                  className={`focus-session-dot ${i < (sessionsCompleted % settings.sessionsUntilLongBreak) ? 'completed' : ''}`}
                />
              ))}
            </div>
            <span className="focus-sessions-count">{sessionsCompleted}</span>
          </div>
        )}
        
        {/* Статистика за сегодня */}
        {(!isRunning || showExtras) && state.focusSessions && state.focusSessions.length > 0 && (
          <div className="focus-today-stats">
            <span className="focus-stats-label">Сегодня в фокусе:</span>
            <span className="focus-stats-value">
              {Math.round(
                state.focusSessions
                  .filter(s => s.date?.startsWith(new Date().toISOString().split('T')[0]))
                  .reduce((sum, s) => sum + (s.duration || 0), 0) / 60
              )} мин
            </span>
          </div>
        )}
        
        {/* Подсказка при работе таймера */}
        {isRunning && !showExtras && (
          <div className="focus-swipe-hint">
            Свайп вниз для настроек
          </div>
        )}
      </div>
    </Layout>
  );
}
