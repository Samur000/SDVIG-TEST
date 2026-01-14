import { useState, useMemo, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/UI';
import { useApp } from '../../store/AppContext';
import { Transaction, Wallet, CURRENCY_SYMBOLS } from '../../types';
import { formatDateShort, groupByDate, isThisWeek, isThisMonth } from '../../utils/date';
import { TransactionForm } from './TransactionForm';
import { WalletForm, WalletIconSVG } from './WalletForm';
import './FinancePage.css';

const TRANSACTIONS_VISIBILITY_KEY = 'sdvig_finance_transactions_visible';

export function FinancePage() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [initialTab, setInitialTab] = useState<'expense' | 'income' | 'transfer'>('expense');
  
  const [showTransactions, setShowTransactions] = useState(() => {
    const saved = localStorage.getItem(TRANSACTIONS_VISIBILITY_KEY);
    return saved !== null ? saved === 'true' : true;
  });
  
  useEffect(() => {
    localStorage.setItem(TRANSACTIONS_VISIBILITY_KEY, String(showTransactions));
  }, [showTransactions]);
  
  // Общий баланс (группировка по валютам)
  const balancesByCurrency = useMemo(() => {
    const balances: Record<string, number> = {};
    state.wallets.forEach(w => {
      balances[w.currency] = (balances[w.currency] || 0) + w.balance;
    });
    return balances;
  }, [state.wallets]);
  
  // Сортируем транзакции
  const sortedTransactions = useMemo(() => 
    [...state.transactions].sort((a, b) => {
      const timeA = a.createdAt || a.date;
      const timeB = b.createdAt || b.date;
      return timeB.localeCompare(timeA);
    }),
    [state.transactions]
  );
  
  const groupedTransactions = useMemo(() => 
    groupByDate(sortedTransactions),
    [sortedTransactions]
  );
  
  // Аналитика (только RUB для простоты)
  const weekExpenses = useMemo(() => 
    state.transactions
      .filter(t => t.type === 'expense' && isThisWeek(t.date))
      .reduce((sum, t) => sum + t.amount, 0),
    [state.transactions]
  );
  
  const monthExpenses = useMemo(() => 
    state.transactions
      .filter(t => t.type === 'expense' && isThisMonth(t.date))
      .reduce((sum, t) => sum + t.amount, 0),
    [state.transactions]
  );
  
  const topCategories = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    state.transactions
      .filter(t => t.type === 'expense' && isThisMonth(t.date))
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });
    
    return Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  }, [state.transactions]);
  
  const handleSaveTransaction = (tx: Transaction) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: tx });
    setShowForm(false);
  };
  
  const handleDeleteTransaction = (id: string) => {
    if (confirm('Удалить операцию?')) {
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    }
  };
  
  const handleSaveWallet = (wallet: Wallet) => {
    if (editingWallet) {
      dispatch({ type: 'UPDATE_WALLET', payload: wallet });
    } else {
      dispatch({ type: 'ADD_WALLET', payload: wallet });
    }
    setShowWalletForm(false);
    setEditingWallet(null);
  };
  
  const handleDeleteWallet = (id: string) => {
    if (state.wallets.length <= 1) {
      alert('Нельзя удалить последний кошелёк');
      return;
    }
    if (confirm('Удалить кошелёк? Все связанные операции также будут удалены.')) {
      dispatch({ type: 'DELETE_WALLET', payload: id });
    }
  };
  
  const formatMoney = (amount: number, currency: string = 'RUB') => {
    const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || '₽';
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount) + ' ' + symbol;
  };
  
  const getWallet = (walletId: string) => state.wallets.find(w => w.id === walletId);
  
  const getTransactionDisplay = (tx: Transaction) => {
    const wallet = getWallet(tx.walletId);
    
    if (tx.type === 'transfer') {
      const toWallet = getWallet(tx.toWalletId || '');
      const toAmount = tx.toAmount || tx.amount;
      return {
        title: `${wallet?.name || '?'} → ${toWallet?.name || '?'}`,
        subtitle: tx.comment || 'Перевод',
        amountFrom: formatMoney(tx.amount, wallet?.currency), // Списано (красным)
        amountTo: formatMoney(toAmount, toWallet?.currency), // Зачислено (зеленым)
        color: wallet?.color || '#6B7280',
        wallet: wallet,
        toWallet: toWallet,
        isTransfer: true
      };
    }
    
    return {
      title: wallet?.name || 'Неизвестный кошелёк',
      subtitle: tx.category,
      amount: (tx.type === 'income' ? '+' : '-') + formatMoney(tx.amount, wallet?.currency),
      color: wallet?.color || '#6B7280',
      wallet: wallet,
      isTransfer: false
    };
  };
  
  return (
    <Layout title="Финансы">
      {/* Горизонтальный скролл кошельков */}
      <div className="wallets-scroll">
        <div className="wallets-container">
          {state.wallets.map(wallet => (
            <div 
              key={wallet.id} 
              className="wallet-card"
              style={{ borderColor: wallet.color }}
              onClick={() => { setEditingWallet(wallet); setShowWalletForm(true); }}
            >
              <div className="wallet-card-icon" style={{ backgroundColor: wallet.color + '20', color: wallet.color }}>
                <WalletIconSVG icon={wallet.icon} color={wallet.color} />
        </div>
              <div className="wallet-card-info">
                <span className="wallet-card-name">{wallet.name}</span>
                <span className="wallet-card-balance">
                  {formatMoney(wallet.balance, wallet.currency)}
                </span>
          </div>
          </div>
          ))}
          
          {/* Кнопка добавления кошелька */}
          <button 
            className="wallet-card wallet-add-card"
            onClick={() => { setEditingWallet(null); setShowWalletForm(true); }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Добавить</span>
          </button>
        </div>
      </div>
      
      {/* Общий баланс по валютам */}
      <div className="total-balances">
        {Object.entries(balancesByCurrency).map(([currency, balance]) => (
          <div key={currency} className="total-balance-item">
            <span className="total-balance-label">Всего {currency}</span>
            <span className="total-balance-value">{formatMoney(balance, currency)}</span>
          </div>
        ))}
      </div>
      
      {/* Аналитика */}
      <div className="analytics-section">
        <h3>Аналитика расходов</h3>
        <div className="analytics-cards">
          <div className="analytics-card">
            <span className="analytics-label">За неделю</span>
            <span className="analytics-value">{formatMoney(weekExpenses)}</span>
          </div>
          <div className="analytics-card">
            <span className="analytics-label">За месяц</span>
            <span className="analytics-value">{formatMoney(monthExpenses)}</span>
          </div>
        </div>
        
        {topCategories.length > 0 && (
          <div className="top-categories">
            <span className="analytics-label">Топ категорий</span>
            <div className="category-list">
              {topCategories.map(([category, amount]) => (
                <div key={category} className="category-item">
                  <span>{category}</span>
                  <span>{formatMoney(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Кнопка добавления операции */}
      <button className="add-transaction-btn btn btn-primary filled" onClick={() => { setInitialTab('expense'); setShowForm(true); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Добавить операцию
      </button>
      
      {/* Кнопка перевода */}
      <button className="transfer-btn btn" onClick={() => { setInitialTab('transfer'); setShowForm(true); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 16l-4-4m0 0l4-4m-4 4h18"/>
          <path d="M17 8l4 4m0 0l-4 4m4-4H3"/>
        </svg>
        Перевод
      </button>
      
      {/* Список транзакций */}
      <div className="transactions-section">
        {sortedTransactions.length === 0 ? (
          <>
            <h3>История операций</h3>
            <EmptyState
              title="Нет операций"
              text="Добавьте первую операцию"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              }
            />
          </>
        ) : (
          <div className="archive-section">
            <button 
              className="archive-toggle"
              onClick={() => setShowTransactions(!showTransactions)}
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className={`archive-icon ${showTransactions ? 'open' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              <span>История операций</span>
              <span className="archive-count">{sortedTransactions.length}</span>
            </button>
            
            {showTransactions && (
              <div className="transactions-list">
                {Object.entries(groupedTransactions)
                  .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                  .map(([date, txs]) => (
                  <div key={date} className="transactions-group">
                    <div className="transactions-date">{formatDateShort(date)}</div>
                    {txs.map(tx => {
                      const display = getTransactionDisplay(tx);
                      return (
                      <div key={tx.id} className="transaction-item">
                          <div 
                            className="transaction-color-indicator" 
                            style={{ backgroundColor: display.color }}
                          />
                        <div className="transaction-info">
                            {display.isTransfer ? (
                              <div className="transaction-title-row transfer-row">
                                <div className="transfer-from-part">
                                  {display.wallet && (
                                    <>
                                      <div 
                                        className="transaction-wallet-icon"
                                        style={{ backgroundColor: display.wallet.color + '20', color: display.wallet.color }}
                                      >
                                        <WalletIconSVG icon={display.wallet.icon} color={display.wallet.color} size={14} />
                                      </div>
                                      <span className="transaction-category">{display.wallet.name || '?'}</span>
                                    </>
                                  )}
                                </div>
                                <span className="transfer-arrow">→</span>
                                <div className="transfer-to-part">
                                  {display.toWallet && (
                                    <>
                                      <div 
                                        className="transaction-wallet-icon"
                                        style={{ backgroundColor: display.toWallet.color + '20', color: display.toWallet.color }}
                                      >
                                        <WalletIconSVG icon={display.toWallet.icon} color={display.toWallet.color} size={14} />
                                      </div>
                                      <span className="transaction-category">{display.toWallet.name || '?'}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="transaction-title-row">
                                {display.wallet && (
                                  <div 
                                    className="transaction-wallet-icon"
                                    style={{ backgroundColor: display.wallet.color + '20', color: display.wallet.color }}
                                  >
                                    <WalletIconSVG icon={display.wallet.icon} color={display.wallet.color} size={14} />
                                  </div>
                                )}
                                <span className="transaction-category">{display.title}</span>
                              </div>
                          )}
                            <span className="transaction-wallet">{display.subtitle}</span>
                        </div>
                        <div className="transaction-right">
                          {display.isTransfer ? (
                            <div className="transfer-amounts">
                              <span className="transaction-amount transfer-from">
                                -{display.amountFrom}
                              </span>
                              <span className="transaction-amount transfer-to">
                                +{display.amountTo}
                              </span>
                            </div>
                          ) : (
                          <span className={`transaction-amount ${tx.type}`}>
                              {display.amount}
                          </span>
                          )}
                          <button 
                            className="transaction-delete"
                            onClick={() => handleDeleteTransaction(tx.id)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Модалка транзакции */}
      <Modal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)}
        title="Новая операция"
        size="lg"
      >
        <TransactionForm
          wallets={state.wallets}
          categories={state.categories}
          onSave={handleSaveTransaction}
          onCancel={() => setShowForm(false)}
          onAddCategory={(cat) => dispatch({ type: 'ADD_CATEGORY', payload: cat })}
          isOpen={showForm}
          initialTab={initialTab}
        />
      </Modal>
      
      {/* Модалка кошелька */}
      <Modal 
        isOpen={showWalletForm} 
        onClose={() => { setShowWalletForm(false); setEditingWallet(null); }}
        title={editingWallet ? 'Редактировать кошелёк' : 'Новый кошелёк'}
        size="lg"
      >
        <WalletForm
          wallet={editingWallet}
          onSave={handleSaveWallet}
          onCancel={() => { setShowWalletForm(false); setEditingWallet(null); }}
        />
        {editingWallet && (
          <div className="wallet-form-delete">
            <button 
              className="btn btn-danger"
              onClick={() => { handleDeleteWallet(editingWallet.id); setShowWalletForm(false); setEditingWallet(null); }}
            >
              Удалить кошелёк
            </button>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
