import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/UI';
import { useApp } from '../../store/AppContext';
import { Document } from '../../types';
import { DocumentForm } from './DocumentForm';
import { WeeklyReport } from './WeeklyReport';
import './ProfilePage.css';

export function ProfilePage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [showDocForm, setShowDocForm] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  
  // Фолбэки для старых/повреждённых данных из хранилища
  const documents = state.documents ?? [];
  
  const handleAddDocument = (doc: Document) => {
    dispatch({ type: 'ADD_DOCUMENT', payload: doc });
    setShowDocForm(false);
  };
  
  const handleDeleteDocument = (id: string) => {
    if (confirm('Удалить документ?')) {
      dispatch({ type: 'DELETE_DOCUMENT', payload: id });
    }
  };
  
  // Функция для скачивания/поделиться документом
  const handleShareDocument = useCallback(async (doc: Document) => {
    if (!doc.imageBase64) return;
    
    try {
      // Конвертируем base64 в blob
      const response = await fetch(doc.imageBase64);
      const blob = await response.blob();
      const file = new File([blob], `${doc.name}.${blob.type.split('/')[1] || 'png'}`, { type: blob.type });
      
      // Пробуем использовать Web Share API
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: doc.name,
        });
      } else {
        // Fallback - скачивание файла
        const link = document.createElement('a');
        link.href = doc.imageBase64;
        link.download = `${doc.name}.png`;
        link.click();
      }
    } catch (error) {
      // Если share отменен пользователем - игнорируем
      if ((error as Error).name !== 'AbortError') {
        console.error('Ошибка при попытке поделиться:', error);
      }
    }
  }, []);
  
  return (
    <Layout 
      title="Я"
      headerRight={
        <button 
          className="header-settings-btn" 
          onClick={() => navigate('/settings')}
          title="Настройки"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </button>
      }
    >
      {/* Блок профиля */}
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {state.profile?.avatar ? (
              <img src={state.profile.avatar} alt={state.profile.name || 'Профиль'} />
            ) : (
              <span>{state.profile?.name?.[0]?.toUpperCase() || '?'}</span>
            )}
          </div>
          <div className="profile-info">
            <div className="profile-name">
              {state.profile?.name || 'Не указано'}
            </div>
            {state.profile?.bio && (
              <div className="profile-bio">{state.profile.bio}</div>
            )}
          </div>
        </div>
        {state.profile?.goals && state.profile.goals.length > 0 && (
          <div className="profile-goals">
            <span className="goals-label">Цели</span>
            <div className="goals-list">
              {state.profile.goals.map((goal, index) => (
                <span key={index} className="goal-tag">
                  {goal}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Недельный отчёт */}
      <WeeklyReport />
      
      {/* Документы */}
      <div className="documents-section">
        <div className="documents-header">
          <h3>Документы</h3>
          <button className="btn btn-sm btn-primary" onClick={() => setShowDocForm(true)}>
            + Добавить
          </button>
        </div>
        
        {documents.length === 0 ? (
          <EmptyState
            title="Нет документов"
            text="Добавьте важные документы"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            }
          />
        ) : (
          <div className="documents-grid">
            {documents.map(doc => (
              <div key={doc.id} className="document-card">
                <div 
                  className="document-preview"
                  onClick={() => doc.imageBase64 && setPreviewDoc(doc)}
                  style={{ cursor: doc.imageBase64 ? 'pointer' : 'default' }}
                >
                  {doc.imageBase64 ? (
                    <img src={doc.imageBase64} alt={doc.name} />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  )}
                </div>
                <div className="document-info">
                  <span className="document-name">{doc.name}</span>
                  <div className="document-actions">
                    {doc.imageBase64 && (
                      <button 
                        className="document-action-btn"
                        onClick={() => handleShareDocument(doc)}
                        title="Поделиться"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="18" cy="5" r="3"/>
                          <circle cx="6" cy="12" r="3"/>
                          <circle cx="18" cy="19" r="3"/>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                      </button>
                    )}
                    <button 
                      className="document-action-btn text-danger"
                      onClick={() => handleDeleteDocument(doc.id)}
                      title="Удалить"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Модалки */}
      <Modal
        isOpen={showDocForm}
        onClose={() => setShowDocForm(false)}
        title="Добавить документ"
      >
        <DocumentForm
          onSave={handleAddDocument}
          onCancel={() => setShowDocForm(false)}
        />
      </Modal>
      
      {/* Модалка предпросмотра документа */}
      {previewDoc && (
        <div className="document-preview-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="document-preview-container" onClick={e => e.stopPropagation()}>
            <button 
              className="document-preview-close"
              onClick={() => setPreviewDoc(null)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className="document-preview-header">
              <h3>{previewDoc.name}</h3>
            </div>
            {previewDoc.imageBase64 && (
              <img 
                src={previewDoc.imageBase64} 
                alt={previewDoc.name}
                className="document-preview-image"
              />
            )}
            <div className="document-preview-actions">
              <button 
                className="btn btn-primary filled"
                onClick={() => handleShareDocument(previewDoc)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Поделиться
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
