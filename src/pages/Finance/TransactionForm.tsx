import React, { useState, useRef, useEffect } from 'react';
import { Transaction, TransactionType, Wallet } from '../../types';
import { getToday } from '../../utils/date';
import { v4 as uuid } from 'uuid';
import './TransactionForm.css';

interface TransactionFormProps {
  wallets: Wallet[];
  categories: string[];
  onSave: (tx: Transaction) => void;
  onCancel: () => void;
  onAddCategory: (category: string) => void;
  isOpen?: boolean; // Для отслеживания открытия модалки
}

export function TransactionForm({ wallets, categories, onSave, onCancel, onAddCategory, isOpen = true }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [category, setCategory] = useState(categories[0] || '');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [date, setDate] = useState(getToday());
  const [comment, setComment] = useState('');
  const amountInputRef = useRef<HTMLInputElement>(null);
  
  // Определяем iOS устройство
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Автофокус на поле суммы при открытии формы (с поддержкой iOS)
  useEffect(() => {
    if (!isOpen) return;
    
    const focusInput = () => {
      const input = amountInputRef.current;
      if (!input) return;
      
      // Для iOS используем более агрессивный подход
      if (isIOS) {
        // iOS Safari требует пользовательского взаимодействия для открытия клавиатуры
        // Используем несколько попыток с разными методами
        let attempts = 0;
        const maxAttempts = 6;
        
        const attemptFocus = () => {
          if (attempts < maxAttempts && input) {
            attempts++;
            
            // Чередуем методы для лучшей совместимости
            if (attempts % 2 === 0) {
              input.focus();
            } else {
              // Для iOS иногда помогает click перед focus
              input.click();
              setTimeout(() => input.focus(), 10);
            }
            
            if (attempts < maxAttempts) {
              setTimeout(attemptFocus, 80);
            }
          }
        };
        
        // Начинаем после задержки для полного открытия модалки
        setTimeout(() => {
          attemptFocus();
        }, 350);
      } else {
        // Для Android и других устройств
        setTimeout(() => {
          input.focus();
        }, 150);
      }
    };
    
    // Используем requestAnimationFrame для синхронизации с рендерингом
    const rafId = requestAnimationFrame(() => {
      setTimeout(focusInput, 0);
    });
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isOpen, isIOS]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || !walletId || (!category && !newCategory.trim())) return;
    
    const finalCategory = showNewCategory ? newCategory.trim() : category;
    
    if (showNewCategory && newCategory.trim()) {
      onAddCategory(newCategory.trim());
    }
    
    onSave({
      id: uuid(),
      type,
      amount: numAmount,
      date,
      walletId,
      category: finalCategory,
      comment: comment.trim() || undefined,
      createdAt: new Date().toISOString()
    });
  };
  
  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      {/* Переключатель типа */}
      <div className="type-toggle">
        <button
          type="button"
          className={`type-btn ${type === 'expense' ? 'active expense' : ''}`}
          onClick={() => setType('expense')}
        >
          Расход
        </button>
        <button
          type="button"
          className={`type-btn ${type === 'income' ? 'active income' : ''}`}
          onClick={() => setType('income')}
        >
          Доход
        </button>
      </div>
      
      {/* Сумма */}
      <div className="form-group">
        <label className="form-label">Сумма</label>
        <div className="amount-input">
          <input
            ref={amountInputRef}
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            required
          />
          <span className="amount-currency">₽</span>
        </div>
      </div>
      
      {/* Кошелёк */}
      <div className="form-group">
        <label className="form-label">Кошелёк</label>
        <select value={walletId} onChange={e => setWalletId(e.target.value)} required>
          {wallets.map(w => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.type === 'cash' ? 'наличные' : 'карта'})
            </option>
          ))}
        </select>
      </div>
      
      {/* Категория */}
      <div className="form-group">
        <label className="form-label">Категория</label>
        {!showNewCategory ? (
          <div className="category-select">
            <select value={category} onChange={e => setCategory(e.target.value)} required>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button 
              type="button" 
              className="add-category-btn"
              onClick={() => setShowNewCategory(true)}
            >
              + Новая
            </button>
          </div>
        ) : (
          <div className="category-select">
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="Название категории"
              required
            />
            <button 
              type="button" 
              className="add-category-btn"
              onClick={() => setShowNewCategory(false)}
            >
              Отмена
            </button>
          </div>
        )}
      </div>
      
      {/* Дата */}
      <div className="form-group">
        <label className="form-label">Дата</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>
      
      {/* Комментарий */}
      <div className="form-group">
        <label className="form-label">Комментарий (опционально)</label>
        <input
          type="text"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Заметка..."
        />
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Отмена
        </button>
        <button 
          type="submit" 
          className="btn btn-primary filled"
          disabled={!amount || !walletId}
        >
          Сохранить
        </button>
      </div>
    </form>
  );
}

