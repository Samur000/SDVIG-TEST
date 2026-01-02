import React, { useState, useRef, useEffect } from 'react';
import { Transaction, Wallet, CURRENCY_SYMBOLS } from '../../types';
import { getToday } from '../../utils/date';
import { v4 as uuid } from 'uuid';
import { WalletIconSVG } from './WalletForm';
import './TransactionForm.css';

interface TransactionFormProps {
  wallets: Wallet[];
  categories: string[];
  onSave: (tx: Transaction) => void;
  onCancel: () => void;
  onAddCategory: (category: string) => void;
  isOpen?: boolean;
  initialTab?: 'expense' | 'income' | 'transfer';
}

type TabType = 'expense' | 'income' | 'transfer';

export function TransactionForm({ wallets, categories, onSave, onCancel, onAddCategory, isOpen = true, initialTab = 'expense' }: TransactionFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [category, setCategory] = useState(categories[0] || '');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [date, setDate] = useState(getToday());
  const [comment, setComment] = useState('');
  
  // Поля для переводов
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || wallets[0]?.id || '');
  const [exchangeRate, setExchangeRate] = useState('');
  
  // Состояния для кастомных dropdown
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  
  const amountInputRef = useRef<HTMLInputElement>(null);
  const walletDropdownRef = useRef<HTMLDivElement>(null);
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);
  const [isReadonly, setIsReadonly] = useState(true);
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Получаем информацию о кошельках для перевода
  const fromWallet = wallets.find(w => w.id === walletId);
  const toWallet = wallets.find(w => w.id === toWalletId);
  const isSameCurrency = fromWallet?.currency === toWallet?.currency;
  
  // Автофокус
  useEffect(() => {
    if (!isOpen) {
      setIsReadonly(true);
      return;
    }
    
    const focusInput = () => {
      const input = amountInputRef.current;
      if (!input) return;
      
      if (isIOS) {
        setIsReadonly(true);
        setTimeout(() => {
          setIsReadonly(false);
          requestAnimationFrame(() => {
            input.focus();
            if (input.setSelectionRange) {
              setTimeout(() => input.setSelectionRange(0, 0), 10);
            }
          });
        }, 100);
      } else {
        setIsReadonly(false);
        setTimeout(() => input.focus(), 150);
      }
    };
    
    const timeout = setTimeout(focusInput, isIOS ? 300 : 150);
    return () => clearTimeout(timeout);
  }, [isOpen, isIOS]);
  
  // Сброс toWalletId при смене walletId
  useEffect(() => {
    if (walletId === toWalletId && wallets.length > 1) {
      const other = wallets.find(w => w.id !== walletId);
      if (other) setToWalletId(other.id);
    }
  }, [walletId, toWalletId, wallets]);
  
  // Сброс activeTab при смене initialTab
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  
  // Меняем кошельки местами
  const swapWallets = () => {
    const tmp = walletId;
    setWalletId(toWalletId);
    setToWalletId(tmp);
  };
  
  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(e.target as Node)) {
        setShowWalletDropdown(false);
      }
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(e.target as Node)) {
        setShowFromDropdown(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(e.target as Node)) {
        setShowToDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || !walletId) return;
    
    if (activeTab === 'transfer') {
      if (!toWalletId || toWalletId === walletId) return;
      
      const numExchangeRate = parseFloat(exchangeRate);
      const calculatedToAmount = isSameCurrency ? numAmount : numAmount * numExchangeRate;
      if (!isSameCurrency && !numExchangeRate) return;
      
      onSave({
        id: uuid(),
        type: 'transfer',
        amount: numAmount,
        date,
        walletId,
        toWalletId,
        toAmount: calculatedToAmount,
        category: 'Перевод',
        comment: comment.trim() || undefined,
        createdAt: new Date().toISOString()
      });
    } else {
    const finalCategory = showNewCategory ? newCategory.trim() : category;
      if (!finalCategory) return;
    
    if (showNewCategory && newCategory.trim()) {
      onAddCategory(newCategory.trim());
    }
    
    onSave({
      id: uuid(),
        type: activeTab,
      amount: numAmount,
      date,
      walletId,
      category: finalCategory,
      comment: comment.trim() || undefined,
      createdAt: new Date().toISOString()
    });
    }
  };
  
  const getCurrencySymbol = (wId: string) => {
    const w = wallets.find(wallet => wallet.id === wId);
    return w ? CURRENCY_SYMBOLS[w.currency] : '₽';
  };
  
  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      {/* Табы с анимированным индикатором */}
      <div className="transaction-tabs">
        <div className={`transaction-tabs-indicator ${activeTab}`} />
        <button
          type="button"
          className={`transaction-tab ${activeTab === 'expense' ? 'active expense' : ''}`}
          onClick={() => setActiveTab('expense')}
        >
          Расход
        </button>
        <button
          type="button"
          className={`transaction-tab ${activeTab === 'income' ? 'active income' : ''}`}
          onClick={() => setActiveTab('income')}
        >
          Доход
        </button>
        <button
          type="button"
          className={`transaction-tab ${activeTab === 'transfer' ? 'active transfer' : ''}`}
          onClick={() => setActiveTab('transfer')}
        >
          Перевод
        </button>
      </div>
      
      {/* Сумма */}
      <div className="form-group">
        <label className="form-label">
          {activeTab === 'transfer' ? 'Сумма списания' : 'Сумма'}
        </label>
        <div className="amount-input">
          <input
            ref={amountInputRef}
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onTouchStart={(e) => {
              if (isIOS && isReadonly) {
                setIsReadonly(false);
                setTimeout(() => e.currentTarget.focus(), 10);
              }
            }}
            onClick={(e) => {
              if (isIOS && isReadonly) {
                setIsReadonly(false);
                setTimeout(() => e.currentTarget.focus(), 10);
              }
            }}
            readOnly={isIOS && isReadonly}
            placeholder="0"
            min="0"
            step="0.01"
            required
          />
          <span className="amount-currency">{getCurrencySymbol(walletId)}</span>
        </div>
      </div>
      
      {/* Кошелёк (для доход/расход) */}
      {activeTab !== 'transfer' && (
      <div className="form-group">
        <label className="form-label">Кошелёк</label>
          <div className="custom-wallet-select" ref={walletDropdownRef}>
            <button 
              type="button"
              className="custom-wallet-trigger"
              onClick={() => setShowWalletDropdown(!showWalletDropdown)}
            >
              {fromWallet && (
                <>
                  <div className="wallet-select-icon" style={{ backgroundColor: fromWallet.color + '20' }}>
                    <WalletIconSVG icon={fromWallet.icon} color={fromWallet.color} />
                  </div>
                  <span className="wallet-select-name">{fromWallet.name}</span>
                  <span className="wallet-select-currency">{CURRENCY_SYMBOLS[fromWallet.currency]}</span>
                </>
              )}
              <svg className="wallet-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showWalletDropdown && (
              <div className="custom-wallet-dropdown">
                {wallets.map(w => (
                  <button
                    key={w.id}
                    type="button"
                    className={`custom-wallet-option ${w.id === walletId ? 'active' : ''}`}
                    onClick={() => { setWalletId(w.id); setShowWalletDropdown(false); }}
                  >
                    <div className="wallet-select-icon" style={{ backgroundColor: w.color + '20' }}>
                      <WalletIconSVG icon={w.icon} color={w.color} />
                    </div>
                    <span className="wallet-select-name">{w.name}</span>
                    <span className="wallet-select-currency">{CURRENCY_SYMBOLS[w.currency]}</span>
                    {w.id === walletId && (
                      <svg className="wallet-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Перевод: Горизонтальные кошельки со стрелкой */}
      {activeTab === 'transfer' && (
        <>
          <div className="transfer-wallets-row">
            <div className="transfer-wallet-field" ref={fromDropdownRef}>
              <label className="form-label">Откуда</label>
              <div className="custom-wallet-select compact">
                <button 
                  type="button"
                  className="custom-wallet-trigger"
                  onClick={() => { setShowFromDropdown(!showFromDropdown); setShowToDropdown(false); }}
                >
                  {fromWallet && (
                    <>
                      <div className="wallet-select-icon small" style={{ backgroundColor: fromWallet.color + '20' }}>
                        <WalletIconSVG icon={fromWallet.icon} color={fromWallet.color} />
                      </div>
                      <span className="wallet-select-name">{fromWallet.name}</span>
                    </>
                  )}
                  <svg className="wallet-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {showFromDropdown && (
                  <div className="custom-wallet-dropdown">
                    {wallets.map(w => (
                      <button
                        key={w.id}
                        type="button"
                        className={`custom-wallet-option ${w.id === walletId ? 'active' : ''}`}
                        onClick={() => { setWalletId(w.id); setShowFromDropdown(false); }}
                      >
                        <div className="wallet-select-icon small" style={{ backgroundColor: w.color + '20' }}>
                          <WalletIconSVG icon={w.icon} color={w.color} />
                        </div>
                        <span className="wallet-select-name">{w.name}</span>
                        <span className="wallet-select-currency">{CURRENCY_SYMBOLS[w.currency]}</span>
                        {w.id === walletId && (
                          <svg className="wallet-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <button 
              type="button" 
              className="swap-wallets-btn"
              onClick={swapWallets}
              title="Поменять местами"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 16l-4-4m0 0l4-4m-4 4h18"/>
                <path d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </button>
            
            <div className="transfer-wallet-field" ref={toDropdownRef}>
              <label className="form-label">Куда</label>
              <div className="custom-wallet-select compact">
                <button 
                  type="button"
                  className="custom-wallet-trigger"
                  onClick={() => { setShowToDropdown(!showToDropdown); setShowFromDropdown(false); }}
                >
                  {toWallet && (
                    <>
                      <div className="wallet-select-icon small" style={{ backgroundColor: toWallet.color + '20' }}>
                        <WalletIconSVG icon={toWallet.icon} color={toWallet.color} />
                      </div>
                      <span className="wallet-select-name">{toWallet.name}</span>
                    </>
                  )}
                  <svg className="wallet-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {showToDropdown && (
                  <div className="custom-wallet-dropdown">
          {wallets.map(w => (
                      <button
                        key={w.id}
                        type="button"
                        className={`custom-wallet-option ${w.id === toWalletId ? 'active' : ''}`}
                        onClick={() => { setToWalletId(w.id); setShowToDropdown(false); }}
                      >
                        <div className="wallet-select-icon small" style={{ backgroundColor: w.color + '20' }}>
                          <WalletIconSVG icon={w.icon} color={w.color} />
                        </div>
                        <span className="wallet-select-name">{w.name}</span>
                        <span className="wallet-select-currency">{CURRENCY_SYMBOLS[w.currency]}</span>
                        {w.id === toWalletId && (
                          <svg className="wallet-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Предупреждение если один кошелёк */}
          {walletId === toWalletId && (
            <div className="transfer-warning">
              Выберите разные кошельки
            </div>
          )}
          
          {/* Курс для разных валют */}
          {!isSameCurrency && walletId !== toWalletId && (
            <div className="form-group">
              <label className="form-label">
                Курс (1 {fromWallet?.currency} = ? {toWallet?.currency})
              </label>
              <div className="amount-input">
                <input
                  type="number"
                  inputMode="decimal"
                  value={exchangeRate}
                  onChange={e => setExchangeRate(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.0001"
                  required
                />
              </div>
              {amount && exchangeRate && (
                <div className="exchange-result-info">
                  <span className="exchange-result-label">Будет зачислено:</span>
                  <span className="exchange-result-value">
                    {(parseFloat(amount) * parseFloat(exchangeRate)).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} {CURRENCY_SYMBOLS[toWallet?.currency || 'RUB']}
                  </span>
                </div>
              )}
      </div>
          )}
        </>
      )}
      
      {/* Категория (только для расхода/дохода) */}
      {activeTab !== 'transfer' && (
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
      )}
      
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
          disabled={!amount || !walletId || (activeTab === 'transfer' && (!toWalletId || toWalletId === walletId || (!isSameCurrency && !exchangeRate)))}
        >
          Сохранить
        </button>
      </div>
    </form>
  );
}
