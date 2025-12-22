import { useState, useMemo, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/UI';
import { useApp } from '../../store/AppContext';
import { Transaction } from '../../types';
import { formatDateShort, groupByDate, isThisWeek, isThisMonth } from '../../utils/date';
import { TransactionForm } from './TransactionForm';
import moneyCash from '../../components/UI/money-cash.png';
import moneyCard from '../../components/UI/money-card.png';
import './FinancePage.css';

const TRANSACTIONS_VISIBILITY_KEY = 'sdvig_finance_transactions_visible';

export function FinancePage() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  
  // Загружаем сохранённое состояние сворачивания из localStorage
  const [showTransactions, setShowTransactions] = useState(() => {
    const saved = localStorage.getItem(TRANSACTIONS_VISIBILITY_KEY);
    return saved !== null ? saved === 'true' : true; // По умолчанию развёрнуто
  });
  
  // Сохраняем состояние в localStorage при изменении
  useEffect(() => {
    localStorage.setItem(TRANSACTIONS_VISIBILITY_KEY, String(showTransactions));
  }, [showTransactions]);
  
  const totalBalance = useMemo(() => 
    state.wallets.reduce((sum, w) => sum + w.balance, 0),
    [state.wallets]
  );
  
  const cashBalance = useMemo(() =>
    state.wallets.filter(w => w.type === 'cash').reduce((sum, w) => sum + w.balance, 0),
    [state.wallets]
  );
  
  const cardBalance = useMemo(() =>
    state.wallets.filter(w => w.type === 'card').reduce((sum, w) => sum + w.balance, 0),
    [state.wallets]
  );
  
  // Сортируем транзакции по времени создания (новые первые)
  const sortedTransactions = useMemo(() => 
    [...state.transactions].sort((a, b) => {
      // Сначала по createdAt (если есть), потом по date
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
  
  // Аналитика
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
  
  // Топ категорий расходов
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
  
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const getWalletName = (walletId: string) => {
    const wallet = state.wallets.find(w => w.id === walletId);
    return wallet?.name || 'Неизвестно';
  };
  
  return (
    <Layout title="Финансы">
      {/* Карточка баланса */}
      <div className="balance-card card-accent">
        <div className="balance-header">
          <span className="balance-label">Мои деньги</span>
          <span className="balance-total">{formatMoney(totalBalance)}</span>
        </div>
        <div className="balance-breakdown">
          <div className="balance-item">
            {/* <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="6" width="20" height="12" rx="2"/>
              <path d="M12 12h.01"/>
            </svg> */}
            <img width='25px' height='25px' src={moneyCash} alt="" />
            {/* <span>Наличные</span> */}
            <strong>{formatMoney(cashBalance)}</strong>
          </div>
          <div className="balance-item">
            {/* <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg> */}
            <img width='25px' height='25px' src={moneyCard} alt="" />
            {/* <span>Карты</span> */}
            <strong>{formatMoney(cardBalance)}</strong>
          </div>
        </div>
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
      
      {/* Кнопка добавления */}
      <button className="add-transaction-btn btn btn-primary filled" onClick={() => setShowForm(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Добавить операцию
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
                    {txs.map(tx => (
                      <div key={tx.id} className="transaction-item">
                        <div className="transaction-info">
                          <span className="transaction-category">{tx.category}</span>
                          <span className="transaction-wallet">{getWalletName(tx.walletId)}</span>
                          {tx.comment && (
                            <span className="transaction-comment">{tx.comment}</span>
                          )}
                        </div>
                        <div className="transaction-right">
                          <span className={`transaction-amount ${tx.type}`}>
                            {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                          </span>
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
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
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
        />
      </Modal>
    </Layout>
  );
}

