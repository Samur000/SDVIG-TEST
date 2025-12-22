import React, { useState, useRef } from 'react';
import { Document } from '../../types';
import { v4 as uuid } from 'uuid';
import './Forms.css';

interface DocumentFormProps {
  onSave: (doc: Document) => void;
  onCancel: () => void;
}

export function DocumentForm({ onSave, onCancel }: DocumentFormProps) {
  const [name, setName] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Проверяем размер (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 5MB.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSave({
      id: uuid(),
      name: name.trim(),
      imageBase64
    });
  };
  
  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Название</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Например: Паспорт"
          required
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Изображение (опционально)</label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
        
        {imageBase64 ? (
          <div className="image-preview">
            <img src={imageBase64} alt="Preview" />
            <button 
              type="button" 
              className="remove-image"
              onClick={() => setImageBase64(undefined)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ) : (
          <button 
            type="button"
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Загрузить изображение
          </button>
        )}
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Отмена
        </button>
        <button 
          type="submit" 
          className="btn btn-primary filled"
          disabled={!name.trim()}
        >
          Сохранить
        </button>
      </div>
    </form>
  );
}

