import React, { useState } from 'react';
import { Wallet, WalletIcon, WalletColor, Currency, WALLET_COLORS, WALLET_ICONS, CURRENCIES, CURRENCY_NAMES, CURRENCY_SYMBOLS } from '../../types';
import { v4 as uuid } from 'uuid';
import './WalletForm.css';

// Импорт PNG иконок
import moneyCardIcon from '../../components/UI/money-card.png';
import moneyCashIcon from '../../components/UI/money-cash.png';

interface WalletFormProps {
  wallet?: Wallet | null;
  onSave: (wallet: Wallet) => void;
  onCancel: () => void;
}

// Иконки для кошельков - PNG для карты и наличных, SVG для остальных
const WalletIconComponent: React.FC<{ icon: WalletIcon; color?: string; size?: number }> = ({ icon, color = 'currentColor', size = 24 }) => {
  // PNG иконки для карты и наличных
  if (icon === 'card') {
    return <img src={moneyCardIcon} alt="Карта" className="wallet-icon-img" style={{ width: size, height: size }} />;
  }
  if (icon === 'cash') {
    return <img src={moneyCashIcon} alt="Наличные" className="wallet-icon-img" style={{ width: size, height: size }} />;
  }
  
  // SVG иконки для остальных типов
  const iconMap: Partial<Record<WalletIcon, React.ReactNode>> = {
    bank: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M3 21h18"/>
        <path d="M3 10h18"/>
        <path d="M5 6l7-3 7 3"/>
        <path d="M4 10v11"/>
        <path d="M20 10v11"/>
        <path d="M8 10v11"/>
        <path d="M12 10v11"/>
        <path d="M16 10v11"/>
      </svg>
    ),
    safe: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2"/>
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 8v8"/>
        <path d="M8 12h8"/>
      </svg>
    ),
    crypto: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727"/>
      </svg>
    ),
    sber: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v12"/>
        <path d="M8 9h8"/>
        <path d="M8 15h8"/>
      </svg>
    ),
    tinkoff: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <path d="M8 12h8"/>
        <path d="M12 8v8"/>
      </svg>
    ),
    home: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )
  };
  
  return <div className="wallet-icon-svg">{iconMap[icon]}</div>;
};

// Для обратной совместимости - алиас
const WalletIconSVG = WalletIconComponent;

export function WalletForm({ wallet, onSave, onCancel }: WalletFormProps) {
  const [name, setName] = useState(wallet?.name || '');
  const [icon, setIcon] = useState<WalletIcon>(wallet?.icon || 'card');
  const [color, setColor] = useState<WalletColor>(wallet?.color || '#3B82F6');
  const [currency, setCurrency] = useState<Currency>(wallet?.currency || 'RUB');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSave({
      id: wallet?.id || uuid(),
      name: name.trim(),
      icon,
      color,
      currency,
      balance: wallet?.balance || 0
    });
  };
  
  return (
    <form className="wallet-form" onSubmit={handleSubmit}>
      {/* Название */}
      <div className="form-group">
        <label className="form-label">Название</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Например: Сбер, Наличные..."
          required
          autoFocus
        />
      </div>
      
      {/* Иконка */}
      <div className="form-group">
        <label className="form-label">Иконка</label>
        <div className="icon-selector">
          {WALLET_ICONS.map(item => (
            <button
              key={item.value}
              type="button"
              className={`icon-btn ${icon === item.value ? 'active' : ''}`}
              onClick={() => setIcon(item.value)}
              title={item.label}
              style={{ color: icon === item.value ? color : undefined }}
            >
              <WalletIconSVG icon={item.value} color={icon === item.value ? color : 'currentColor'} />
            </button>
          ))}
        </div>
      </div>
      
      {/* Цвет */}
      <div className="form-group">
        <label className="form-label">Цвет</label>
        <div className="color-selector">
          {WALLET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`color-btn ${color === c ? 'active' : ''}`}
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
            >
              {color === c && (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Валюта */}
      <div className="form-group">
        <label className="form-label">Валюта</label>
        <select value={currency} onChange={e => setCurrency(e.target.value as Currency)}>
          {CURRENCIES.map(c => (
            <option key={c} value={c}>
              {CURRENCY_SYMBOLS[c]} {c} — {CURRENCY_NAMES[c]}
            </option>
          ))}
        </select>
      </div>
      
      {/* Превью */}
      <div className="wallet-preview">
        <div className="wallet-preview-card" style={{ borderColor: color }}>
          <div className="wallet-preview-icon" style={{ backgroundColor: color + '20', color }}>
            <WalletIconSVG icon={icon} color={color} />
          </div>
          <div className="wallet-preview-info">
            <span className="wallet-preview-name">{name || 'Название'}</span>
            <span className="wallet-preview-currency">{CURRENCY_SYMBOLS[currency]} {currency}</span>
          </div>
        </div>
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
          {wallet ? 'Сохранить' : 'Создать'}
        </button>
      </div>
    </form>
  );
}

export { WalletIconSVG };

