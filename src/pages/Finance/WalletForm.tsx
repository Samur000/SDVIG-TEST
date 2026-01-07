import React, { useState, useRef, useEffect } from 'react';
import { Wallet, WalletIcon, WalletColor, Currency, WALLET_COLORS, WALLET_ICONS, CURRENCIES, CURRENCY_NAMES, CURRENCY_SYMBOLS } from '../../types';
import { v4 as uuid } from 'uuid';
import './WalletForm.css';

// Импорт PNG иконок
import moneyCardIcon from '../../components/UI/money-card.png';
import moneyCashIcon from '../../components/UI/money-cash.png';
import paypalCardIcon from '../../components/UI/paypal-card.png';
import visaCardIcon from '../../components/UI/visa-card.png';
import mastercardCardIcon from '../../components/UI/mastercard-card.png';
import tBankIcon from '../../components/UI/t-bank.png';
import sberbankIcon from '../../components/UI/sberbank.png';
import gazprombankIcon from '../../components/UI/gazprombank.png';
import rosselhozbankIcon from '../../components/UI/rosselhozbank.png';
import vtbIcon from '../../components/UI/vtb.png';

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
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#21A038"/>
        <path d="M12 6v12M8 9h8M8 15h8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
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
    ),
    wallet: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M2 11h20"/>
        <circle cx="16" cy="15" r="1"/>
      </svg>
    ),
    treasure: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="4" y="6" width="16" height="12" rx="2"/>
        <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        <circle cx="12" cy="12" r="3" fill={color} fillOpacity="0.2"/>
        <path d="M12 9v6M9 12h6"/>
        <path d="M4 10h16M4 14h16"/>
      </svg>
    ),
    'money-bag': (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M9 7c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v1h-6V7z" fill={color} fillOpacity="0.1"/>
        <path d="M7 9h10c2 0 3 1 3 3v5c0 2-1 3-3 3H7c-2 0-3-1-3-3v-5c0-2 1-3 3-3z"/>
        <path d="M9 7v2M15 7v2"/>
        <path d="M8 12h8M8 15h6"/>
        <circle cx="12" cy="13.5" r="1" fill={color} fillOpacity="0.3"/>
      </svg>
    ),
    diamond: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M6 3h12l4 6-10 12L2 9l4-6z"/>
        <path d="M11 3l1 9 1-9"/>
        <path d="M5 9h14"/>
      </svg>
    ),
    gift: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="3" y="8" width="18" height="12" rx="1"/>
        <path d="M12 8v12"/>
        <path d="M12 8H7a2 2 0 00-2 2v0a2 2 0 002 2h5"/>
        <path d="M12 8h5a2 2 0 012 2v0a2 2 0 01-2 2h-5"/>
        <path d="M7 4a2 2 0 00-2 2v2h5V6a2 2 0 00-2-2z"/>
        <path d="M17 4a2 2 0 012 2v2h-5V6a2 2 0 012-2z"/>
      </svg>
    ),
    briefcase: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
        <path d="M8 7h8"/>
        <path d="M8 11h8"/>
      </svg>
    ),
    coin: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.1"/>
        <circle cx="12" cy="12" r="7" fill="none"/>
        <path d="M12 5v14M5 12h14" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="2" fill={color} fillOpacity="0.3"/>
      </svg>
    ),
    bills: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="2" y="6" width="20" height="12" rx="2"/>
        <path d="M6 10h12"/>
        <path d="M6 14h8"/>
        <circle cx="18" cy="10" r="1"/>
      </svg>
    ),
    vault: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 9v6"/>
        <path d="M9 12h6"/>
        <path d="M3 8h18"/>
        <path d="M3 16h18"/>
      </svg>
    ),
    investment: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <polyline points="3 14 7 10 11 14 15 10 19 14 21 12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <circle cx="7" cy="10" r="1"/>
        <circle cx="11" cy="14" r="1"/>
        <circle cx="15" cy="10" r="1"/>
        <circle cx="19" cy="14" r="1"/>
      </svg>
    ),
    savings: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M12 2v20"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        <circle cx="12" cy="8" r="1.5"/>
        <circle cx="12" cy="16" r="1.5"/>
      </svg>
    ),
    paypal: (
      <img src={paypalCardIcon} alt="PayPal" className="wallet-icon-img" style={{ width: size, height: size }} />
    ),
    visa: (
      <img src={visaCardIcon} alt="Visa" className="wallet-icon-img" style={{ width: size, height: size }} />
    ),
    mastercard: (
      <img src={mastercardCardIcon} alt="Mastercard" className="wallet-icon-img" style={{ width: size, height: size }} />
    ),
    't-bank': (
      <img src={tBankIcon} alt="Т-Банк" className="wallet-icon-img" style={{ width: size, height: size }} />
    ),
    sberbank: (
      <img src={sberbankIcon} alt="Сбербанк" className="wallet-icon-img" style={{ width: size, height: size }} />
    ),
    gazprombank: (
      <img src={gazprombankIcon} alt="Газпромбанк" className="wallet-icon-img" style={{ width: size, height: size }} />
    ),
    rosselhozbank: (
      <img src={rosselhozbankIcon} alt="Россельхозбанк" className="wallet-icon-img" style={{ width: size, height: size }} />
    ),
    vtb: (
      <img src={vtbIcon} alt="ВТБ" className="wallet-icon-img" style={{ width: size, height: size }} />
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
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  
  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
    };

    if (showCurrencyDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCurrencyDropdown]);

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
        <div className="custom-currency-select" ref={currencyDropdownRef}>
          <button 
            type="button"
            className={`custom-currency-trigger ${showCurrencyDropdown ? 'open' : ''}`}
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
          >
            <span className="currency-symbol">{CURRENCY_SYMBOLS[currency]}</span>
            <span className="currency-code">{currency}</span>
            <span className="currency-name">{CURRENCY_NAMES[currency]}</span>
            <svg className="currency-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {showCurrencyDropdown && (
            <div className="custom-currency-dropdown">
              {CURRENCIES.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`custom-currency-option ${c === currency ? 'active' : ''}`}
                  onClick={() => {
                    setCurrency(c);
                    setShowCurrencyDropdown(false);
                  }}
                >
                  <span className="currency-symbol">{CURRENCY_SYMBOLS[c]}</span>
                  <span className="currency-code">{c}</span>
                  <span className="currency-name">{CURRENCY_NAMES[c]}</span>
                  {c === currency && (
                    <svg className="currency-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
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

