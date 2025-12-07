/**
 * Страница настроек приложения СДВиГ
 * 
 * ВАЖНО: С версии 2.0 экспорт/импорт работает через IndexedDB
 * localStorage больше не используется для основных данных
 */

import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Modal } from '../../components/Modal';
import { useApp } from '../../store/AppContext';
import { Theme, initialState, AppState, Profile } from '../../types';
import { exportAllData, importAllData } from '../../store/indexedDB';
import './ProfilePage.css';

type ModalType = 'export' | 'import' | 'profile' | null;

const GOAL_SUGGESTIONS = ['Здоровье', 'Финансы', 'Развитие', 'Отношения', 'Карьера', 'Хобби'];

export function SettingsPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Состояние для редактирования профиля
  const [name, setName] = useState(state.profile.name || '');
  const [bio, setBio] = useState(state.profile.bio || '');
  const [goals, setGoals] = useState<string[]>(state.profile.goals || []);
  const [newGoal, setNewGoal] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(state.profile.avatar);
  
  // Переключение темы
  const handleThemeChange = (theme: Theme) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };
  
  // Открыть модалку редактирования профиля
  const openProfileModal = () => {
    setName(state.profile.name || '');
    setBio(state.profile.bio || '');
    setGoals(state.profile.goals || []);
    setAvatar(state.profile.avatar);
    setNewGoal('');
    setActiveModal('profile');
  };
  
  // Обработка целей
  const handleToggleGoal = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter(g => g !== goal));
    } else if (goals.length < 3) {
      setGoals([...goals, goal]);
    }
  };
  
  const handleAddCustomGoal = () => {
    if (newGoal.trim() && goals.length < 3) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };
  
  const handleRemoveGoal = (idx: number) => {
    setGoals(goals.filter((_, i) => i !== idx));
  };
  
  // Загрузка аватарки
  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 2MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        setAvatar(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };
  
  const handleRemoveAvatar = () => {
    setAvatar(undefined);
  };
  
  // Сохранение профиля
  const handleSaveProfile = () => {
    const updatedProfile: Profile = {
      name: name.trim(),
      bio: bio.trim() || undefined,
      goals,
      avatar
    };
    dispatch({ type: 'UPDATE_PROFILE', payload: updatedProfile });
    setActiveModal(null);
  };
  
  /**
   * Экспорт данных из IndexedDB
   * Формирует JSON-файл со всеми данными приложения
   */
  const executeExport = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      // Получаем все данные из IndexedDB
      const backupData = await exportAllData();
      
      // Формируем имя файла с датой
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const filename = `sdvig-backup-${dateStr}.json`;
      
      // Создаём и скачиваем файл
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      
      setActiveModal(null);
      console.log('Экспорт данных завершён:', filename);
    } catch (error) {
      console.error('Ошибка при экспорте данных:', error);
      alert('Ошибка при экспорте данных');
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * Импорт данных в IndexedDB
   * Полностью заменяет текущие данные на данные из файла
   * Поддерживает как старый формат (localStorage), так и новый (IndexedDB)
   */
  const executeImport = useCallback(async () => {
    if (!pendingFile) return;
    
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content);
        
        // Импортируем данные в IndexedDB
        // Функция importAllData сама определяет формат файла
        const newState = await importAllData(backupData);
        
        // Обновляем состояние приложения
        const fullState: AppState = { ...initialState, ...newState };
        dispatch({ type: 'LOAD_STATE', payload: fullState });
        
        setActiveModal(null);
        setPendingFile(null);
        
        console.log('Импорт данных завершён');
        alert('Данные успешно восстановлены!');
      } catch (error) {
        console.error('Ошибка при импорте данных:', error);
        alert('Ошибка при чтении файла. Проверьте формат файла.');
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      console.error('Ошибка чтения файла');
      alert('Ошибка чтения файла');
      setIsProcessing(false);
    };
    
    reader.readAsText(pendingFile);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [pendingFile, dispatch]);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setActiveModal('import');
  };
  
  const closeModal = () => {
    if (isProcessing) return; // Не закрываем во время обработки
    setActiveModal(null);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  return (
    <Layout 
      title="Настройки"
      headerRight={
        <button 
          className="header-back-btn" 
          onClick={() => navigate('/profile')}
          title="Назад"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      }
    >
      {/* Личные данные */}
      <div className="settings-section">
        <h3>Личные данные</h3>
        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-title">Профиль</span>
              <span className="settings-item-desc">Имя, фото и цели</span>
            </div>
            <button className="btn btn-sm btn-primary" onClick={openProfileModal}>
              Изменить
            </button>
          </div>
        </div>
      </div>
      
      {/* Оформление */}
      <div className="settings-section">
        <h3>Оформление</h3>
        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-item-info">
              <span className="settings-item-title">Тема оформления</span>
              <span className="settings-item-desc">Выберите светлую или тёмную тему</span>
            </div>
            <div className="theme-toggle">
              <button 
                className={`theme-btn ${state.settings?.theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              </button>
              <button 
                className={`theme-btn ${state.settings?.theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Данные */}
      <div className="settings-section">
        <h3>Данные</h3>
        <div className="settings-list">
          <div className="settings-item backup-section">
            <div className="settings-item-info">
              <span className="settings-item-title">Бэкап данных</span>
              <span className="settings-item-desc">Экспорт и импорт данных приложения</span>
            </div>
            <div className="backup-actions">
              <button className="btn btn-sm" onClick={() => setActiveModal('export')}>
                Экспорт
              </button>
              <label className="btn btn-sm btn-primary">
                Импорт
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* О приложении */}
      <div className="settings-section">
        <h3>О приложении</h3>
        <div className="settings-list">
          <a 
            href="https://samur000.github.io/SDVIG-INFO//" 
            target="_blank" 
            rel="noopener noreferrer"
            className="settings-link"
          >
            <div className="settings-link-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <span>О проекте</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-link-arrow">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
          
          <a 
            href="https://t.me/qafurov" 
            target="_blank" 
            rel="noopener noreferrer"
            className="settings-link"
          >
            <div className="settings-link-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <span>Связаться с разработчиком</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="settings-link-arrow">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        </div>
      </div>
      
      {/* Версия */}
      <div className="settings-version">
        <span>СДВиГ v2.0</span>
        <span className="settings-storage-info">Данные хранятся в IndexedDB</span>
      </div>
      
      {/* Модалка редактирования профиля */}
      <Modal
        isOpen={activeModal === 'profile'}
        onClose={closeModal}
        title="Редактировать профиль"
      >
        <div className="profile-edit-modal">
          {/* Аватарка */}
          <div className="avatar-edit">
            <div className="avatar-preview">
              {avatar ? (
                <img src={avatar} alt="Аватар" />
              ) : (
                <div className="avatar-placeholder">
                  {name ? name[0].toUpperCase() : '?'}
                </div>
              )}
            </div>
            <div className="avatar-actions">
              <label className="btn btn-sm btn-primary">
                {avatar ? 'Изменить' : 'Загрузить'}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  style={{ display: 'none' }}
                />
              </label>
              {avatar && (
                <button className="btn btn-sm" onClick={handleRemoveAvatar}>
                  Удалить
                </button>
              )}
            </div>
          </div>
          
          {/* Имя */}
          <div className="form-group">
            <label className="form-label">Имя</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Как тебя зовут?"
            />
          </div>
          
          {/* О себе */}
          <div className="form-group">
            <label className="form-label">О себе</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Пара слов о себе..."
              rows={2}
            />
          </div>
          
          {/* Цели */}
          <div className="form-group">
            <label className="form-label">Цели (до 3)</label>
            <div className="goals-selector">
              {GOAL_SUGGESTIONS.map(goal => (
                <button
                  key={goal}
                  type="button"
                  className={`goal-btn ${goals.includes(goal) ? 'active' : ''}`}
                  onClick={() => handleToggleGoal(goal)}
                  disabled={!goals.includes(goal) && goals.length >= 3}
                >
                  {goal}
                </button>
              ))}
            </div>
            
            <div className="custom-goal">
              <input
                type="text"
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                placeholder="Своя цель..."
                disabled={goals.length >= 3}
              />
              <button 
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleAddCustomGoal}
                disabled={!newGoal.trim() || goals.length >= 3}
              >
                +
              </button>
            </div>
            
            {goals.length > 0 && (
              <div className="selected-goals">
                {goals.map((goal, idx) => (
                  <span key={idx} className="chip">
                    {goal}
                    <button type="button" onClick={() => handleRemoveGoal(idx)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Кнопки */}
          <div className="form-actions">
            <button className="btn" onClick={closeModal}>Отмена</button>
            <button className="btn btn-primary filled" onClick={handleSaveProfile}>
              Сохранить
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Модалка экспорта */}
      <Modal isOpen={activeModal === 'export'} onClose={closeModal} title="Экспорт данных">
        <div className="confirm-modal">
          <p className="confirm-text">Экспортировать все данные приложения?</p>
          <p className="confirm-hint">Будет скачан JSON-файл с резервной копией.</p>
          <div className="confirm-actions">
            <button className="btn" onClick={closeModal} disabled={isProcessing}>
              Отмена
            </button>
            <button 
              className="btn btn-primary filled" 
              onClick={executeExport}
              disabled={isProcessing}
            >
              {isProcessing ? 'Экспорт...' : 'Да'}
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Модалка импорта */}
      <Modal isOpen={activeModal === 'import'} onClose={closeModal} title="Импорт данных">
        <div className="confirm-modal">
          <p className="confirm-text">Импортировать данные из файла?</p>
          <p className="confirm-hint confirm-warning">Все текущие данные будут заменены!</p>
          {pendingFile && <p className="confirm-file">Файл: {pendingFile.name}</p>}
          <div className="confirm-actions">
            <button className="btn" onClick={closeModal} disabled={isProcessing}>
              Отмена
            </button>
            <button 
              className="btn btn-primary filled" 
              onClick={executeImport}
              disabled={isProcessing}
            >
              {isProcessing ? 'Импорт...' : 'Да'}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
