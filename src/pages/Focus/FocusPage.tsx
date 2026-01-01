import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { useApp } from '../../store/AppContext';
import { saveStateAsync } from '../../store/storage';
import { v4 as uuid } from 'uuid';
import './FocusPage.css';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

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
  
  // Состояние таймера
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(todaySessionsCount);
  const [currentTask, setCurrentTask] = useState('');
  
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionSavedRef = useRef(false);
  
  // Refs для актуальных значений при сохранении
  const modeRef = useRef(mode);
  const timeLeftRef = useRef(timeLeft);
  const currentTaskRef = useRef(currentTask);
  const stateRef = useRef(state);
  
  // Синхронизация refs
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { currentTaskRef.current = currentTask; }, [currentTask]);
  useEffect(() => { stateRef.current = state; }, [state]);
  
  // Получаем длительность для текущего режима
  const getDuration = useCallback((m: TimerMode) => {
    switch (m) {
      case 'focus': return settings.focusDuration * 60;
      case 'shortBreak': return settings.shortBreakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
    }
  }, [settings]);
  
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
      // Простой beep через Web Audio API
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
      
      // Повторяем 3 раза
      setTimeout(() => playSound(), 300);
    } catch (e) {
      // Звук не поддерживается
    }
  }, []);
  
  // Старт таймера
  const handleStart = useCallback(() => {
    setIsRunning(true);
    startTimeRef.current = Date.now();
  }, []);
  
  // Пауза
  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);
  
  // Сброс
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
  }, [getDuration, mode]);
  
  // Сохранение текущей сессии
  const saveCurrentSession = useCallback((completed: boolean = false) => {
    if (mode !== 'focus' || sessionSavedRef.current) return;
    
    const elapsed = getDuration(mode) - timeLeft;
    if (elapsed >= 10) { // Минимум 10 секунд
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
      
      // Также напрямую сохраняем в storage для гарантии
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
      
      const elapsed = getDuration('focus') - timeLeftRef.current;
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
        
        // Сохраняем через dispatch
        dispatch({
          type: 'ADD_FOCUS_SESSION',
          payload: newSession
        });
        
        // Также напрямую сохраняем в storage для гарантии
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
      // Сохраняем при размонтировании компонента (уход со страницы)
      saveSessionDirect();
    };
  }, [getDuration, dispatch]);
  
  // Пропустить (перейти к следующему режиму)
  const handleSkip = useCallback(() => {
    setIsRunning(false);
    
    if (mode === 'focus') {
      // Сохраняем сессию если был фокус
      saveCurrentSession(false);
      
      // Переходим к перерыву
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      
      setTimeout(() => {
        sessionSavedRef.current = false; // Сбрасываем для новой сессии
        if (newSessions % settings.sessionsUntilLongBreak === 0) {
          setMode('longBreak');
          setTimeLeft(getDuration('longBreak'));
        } else {
          setMode('shortBreak');
          setTimeLeft(getDuration('shortBreak'));
        }
      }, 100);
    } else {
      // После перерыва - обратно к фокусу
      sessionSavedRef.current = false;
      setMode('focus');
      setTimeLeft(getDuration('focus'));
    }
  }, [mode, getDuration, sessionsCompleted, settings.sessionsUntilLongBreak, saveCurrentSession]);
  
  // Завершение таймера
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
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
      
      // Сохраняем завершённую сессию через dispatch
      dispatch({
        type: 'ADD_FOCUS_SESSION',
        payload: newSession
      });
      
      // Также напрямую сохраняем в storage для гарантии
      const currentState = stateRef.current;
      const updatedState = { 
        ...currentState, 
        focusSessions: [...(currentState.focusSessions || []), newSession] 
      };
      saveStateAsync(updatedState).catch(console.error);
      stateRef.current = updatedState; // Обновляем ref
      
      sessionSavedRef.current = true;
      
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      
      // Автоматически переходим к перерыву
      setTimeout(() => {
        sessionSavedRef.current = false; // Сбрасываем для новой сессии
        if (newSessions % settings.sessionsUntilLongBreak === 0) {
          setMode('longBreak');
          setTimeLeft(getDuration('longBreak'));
        } else {
          setMode('shortBreak');
          setTimeLeft(getDuration('shortBreak'));
        }
      }, 100);
    } else {
      // После перерыва - обратно к фокусу
      setMode('focus');
      setTimeLeft(getDuration('focus'));
    }
  }, [mode, sessionsCompleted, settings.sessionsUntilLongBreak, getDuration, dispatch, currentTask, playSound]);
  
  // Изменение длительности фокуса
  const handleSetFocusDuration = useCallback((minutes: number) => {
    if (!isRunning && mode === 'focus') {
      setTimeLeft(minutes * 60);
    }
  }, [isRunning, mode]);
  
  // Переключение режима вручную
  const handleSetMode = useCallback((newMode: TimerMode) => {
    if (!isRunning) {
      setMode(newMode);
      setTimeLeft(getDuration(newMode));
    }
  }, [isRunning, getDuration]);
  
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
  const size = 280;
  const strokeWidth = 12;
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
      <div className="focus-page">
        {/* Режимы */}
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
          </div>
        </div>
        
        {/* Пресеты (только для фокуса) */}
        {mode === 'focus' && !isRunning && (
          <div className="focus-presets">
            {PRESETS.map(preset => (
              <button
                key={preset.value}
                className={`focus-preset-btn ${timeLeft === preset.value * 60 ? 'active' : ''}`}
                onClick={() => handleSetFocusDuration(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
        
        {/* Задача */}
        {mode === 'focus' && !isRunning && (
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
        
        {/* Статистика за сегодня */}
        {state.focusSessions && state.focusSessions.length > 0 && (
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
      </div>
    </Layout>
  );
}

