import React, { useState } from 'react';
import { Layout } from '../../components/Layout';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/UI';
import { useApp } from '../../store/AppContext';
import { Idea } from '../../types';
import { v4 as uuid } from 'uuid';
import { getToday } from '../../utils/date';
import './InboxPage.css';

export function InboxPage() {
  const { state, dispatch } = useApp();
  const [inputText, setInputText] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  
  const activeIdeas = state.ideas.filter(i => i.status === 'active');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    dispatch({
      type: 'ADD_IDEA',
      payload: {
        id: uuid(),
        text: inputText.trim(),
        createdAt: new Date().toISOString(),
        status: 'active'
      }
    });
    setInputText('');
  };
  
  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_IDEA', payload: id });
    setSelectedIdea(null);
  };
  
  const handleAddToTodo = (idea: Idea) => {
    dispatch({
      type: 'ADD_TASK',
      payload: {
        id: uuid(),
        title: idea.text,
        completed: false,
        priority: 'normal'
      }
    });
    dispatch({
      type: 'UPDATE_IDEA',
      payload: { ...idea, status: 'processed' }
    });
    setSelectedIdea(null);
  };
  
  const handleAddToSchedule = (idea: Idea) => {
    dispatch({
      type: 'ADD_EVENT',
      payload: {
        id: uuid(),
        title: idea.text,
        date: getToday(),
        completed: false
      }
    });
    dispatch({
      type: 'UPDATE_IDEA',
      payload: { ...idea, status: 'processed' }
    });
    setSelectedIdea(null);
  };
  
  return (
    <Layout title="Инбокс">
      <div className="inbox-intro">
        <p>Выгрузи все мысли из головы. Потом разберёшь.</p>
      </div>
      
      {/* Форма ввода */}
      <form className="inbox-form" onSubmit={handleSubmit}>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Что у тебя на уме?..."
          rows={3}
        />
        <button 
          type="submit" 
          className="btn btn-primary filled"
          disabled={!inputText.trim()}
        >
          Готово
        </button>
      </form>
      
      {/* Список идей */}
      <div className="ideas-section">
        <h3>Мои мысли</h3>
        
        {activeIdeas.length === 0 ? (
          <EmptyState
            title="Пусто"
            text="Запиши первую мысль"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            }
          />
        ) : (
          <div className="ideas-grid">
            {activeIdeas.map(idea => (
              <div 
                key={idea.id} 
                className="idea-chip"
                onClick={() => setSelectedIdea(idea)}
              >
                <span className="idea-text">{idea.text}</span>
                <button 
                  className="idea-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(idea.id);
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Модалка действий */}
      <Modal
        isOpen={!!selectedIdea}
        onClose={() => setSelectedIdea(null)}
        title="Что сделать с мыслью?"
      >
        {selectedIdea && (
          <div className="idea-actions-modal">
            <div className="idea-preview">
              {selectedIdea.text}
            </div>
            
            <div className="idea-action-buttons">
              <button 
                className="idea-action-btn"
                onClick={() => handleAddToTodo(selectedIdea)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                <span>Добавить в To-Do</span>
              </button>
              
              <button 
                className="idea-action-btn"
                onClick={() => handleAddToSchedule(selectedIdea)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Добавить в расписание</span>
              </button>
              
              <button 
                className="idea-action-btn danger"
                onClick={() => handleDelete(selectedIdea.id)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                <span>Удалить</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}

