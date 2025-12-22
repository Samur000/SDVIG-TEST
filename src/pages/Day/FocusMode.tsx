import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../store/AppContext';
import { v4 as uuid } from 'uuid';
import './FocusMode.css';

interface FocusModeProps {
  taskId: string;
  taskTitle: string;
  taskType: 'routine' | 'event';
  dateStr: string;
  onClose: () => void;
  onComplete: () => void;
}

const PRESETS = [
  { label: '15 мин', seconds: 15 * 60 },
  { label: '25 мин', seconds: 25 * 60 },
  { label: '45 мин', seconds: 45 * 60 },
];

export function FocusMode({ taskId, taskTitle, onClose, onComplete }: FocusModeProps) {
  const { dispatch } = useApp();
  const [duration, setDuration] = useState(25 * 60); // 25 минут по умолчанию
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progress = ((duration - timeLeft) / duration) * 100;
  
  const handleStart = useCallback(() => {
    setIsRunning(true);
    startTimeRef.current = Date.now();
  }, []);
  
  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);
  
  const handleStop = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(duration);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [duration]);
  
  const handleSetPreset = useCallback((seconds: number) => {
    setDuration(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
  }, []);
  
  const saveFocusSession = useCallback((completed: boolean) => {
    const elapsed = duration - timeLeft;
    if (elapsed > 0) {
      dispatch({
        type: 'ADD_FOCUS_SESSION',
        payload: {
          id: uuid(),
          taskId,
          taskTitle,
          duration: elapsed,
          date: new Date().toISOString(),
          completed
        }
      });
    }
  }, [dispatch, duration, timeLeft, taskId, taskTitle]);
  
  const handleComplete = useCallback(() => {
    saveFocusSession(true);
    onComplete();
  }, [saveFocusSession, onComplete]);
  
  const handleContinueLater = useCallback(() => {
    saveFocusSession(false);
    onClose();
  }, [saveFocusSession, onClose]);
  
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
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
  }, [isRunning, timeLeft]);
  
  return (
    <div className="focus-overlay">
      <div className="focus-container">
        <button className="focus-close" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        
        <div className="focus-content">
          <h2 className="focus-title">{taskTitle}</h2>
          
          {!isFinished ? (
            <>
              <div className="focus-timer">
                <svg className="focus-progress" viewBox="0 0 200 200">
                  <circle
                    className="focus-progress-bg"
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    strokeWidth="8"
                  />
                  <circle
                    className="focus-progress-fill"
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    strokeWidth="8"
                    strokeDasharray={565.48}
                    strokeDashoffset={565.48 * (1 - progress / 100)}
                    transform="rotate(-90 100 100)"
                  />
                </svg>
                <span className="focus-time">{formatTime(timeLeft)}</span>
              </div>
              
              <div className="focus-presets">
                {PRESETS.map(preset => (
                  <button
                    key={preset.seconds}
                    className={`focus-preset ${duration === preset.seconds ? 'active' : ''}`}
                    onClick={() => handleSetPreset(preset.seconds)}
                    disabled={isRunning}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              
              <div className="focus-controls">
                {!isRunning ? (
                  <button className="btn btn-primary filled" onClick={handleStart}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Старт
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={handlePause}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"/>
                      <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                    Пауза
                  </button>
                )}
                <button className="btn" onClick={handleStop}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                  </svg>
                  Стоп
                </button>
              </div>
            </>
          ) : (
            <div className="focus-finished">
              <div className="focus-finished-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="16 8 10 14 8 12"/>
                </svg>
              </div>
              <p className="focus-finished-text">Время вышло!</p>
              <p className="focus-finished-question">Задачу завершил?</p>
              
              <div className="focus-finished-actions">
                <button className="btn btn-primary filled" onClick={handleComplete}>
                  Да, завершил
                </button>
                <button className="btn" onClick={handleContinueLater}>
                  Продолжу позже
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

