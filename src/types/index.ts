// ============ День / Расписание ============
export type DayOfWeek = 'пн' | 'вт' | 'ср' | 'чт' | 'пт' | 'сб' | 'вс';

export interface Routine {
  id: string;
  title: string;
  description?: string;
  time?: string; // "09:00" или интервал "09:00-10:00"
  days: DayOfWeek[];
  icon?: string;
  completed: Record<string, boolean>; // дата -> выполнено
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string;
  icon?: string;
  completed: boolean;
}

export interface DayTask {
  id: string;
  title: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
}

// ============ Финансы ============

// Иконки кошельков
export type WalletIcon = 
  | 'card' | 'cash' | 'bank' | 'safe' | 'crypto' 
  | 'sber' | 'tinkoff' | 'home'
  | 'wallet' | 'treasure' | 'money-bag' | 'diamond' | 'gift'
  | 'briefcase' | 'coin' | 'bills' | 'vault' | 'investment'
  | 'savings' | 'paypal' | 'visa' | 'mastercard'
  | 't-bank' | 'sberbank' | 'gazprombank' | 'rosselhozbank' | 'vtb';

// Цвета кошельков (пастельные)
export type WalletColor = 
  | '#6366F1' | '#8B5CF6' | '#EC4899' | '#EF4444'
  | '#F59E0B' | '#10B981' | '#14B8A6' | '#3B82F6'
  | '#6B7280' | '#84CC16';

// Валюты (приоритизированные)
export type Currency = 
  | 'RUB' | 'USD' | 'EUR' | 'KZT' | 'BYN' 
  | 'GEL' | 'AMD' | 'UZS' | 'KGS' | 'TJS'
  | 'TRY' | 'AED' | 'CNY' | 'USDT';

// Символы валют
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  RUB: '₽',
  USD: '$',
  EUR: '€',
  KZT: '₸',
  BYN: 'Br',
  GEL: '₾',
  AMD: '֏',
  UZS: 'сўм',
  KGS: 'сом',
  TJS: 'с.',
  TRY: '₺',
  AED: 'د.إ',
  CNY: '¥',
  USDT: '₮'
};

// Названия валют
export const CURRENCY_NAMES: Record<Currency, string> = {
  RUB: 'Российский рубль',
  USD: 'Доллар США',
  EUR: 'Евро',
  KZT: 'Казахстанский тенге',
  BYN: 'Белорусский рубль',
  GEL: 'Грузинский лари',
  AMD: 'Армянский драм',
  UZS: 'Узбекский сум',
  KGS: 'Киргизский сом',
  TJS: 'Таджикский сомони',
  TRY: 'Турецкая лира',
  AED: 'Дирхам ОАЭ',
  CNY: 'Китайский юань',
  USDT: 'Tether (USDT)'
};

// Список всех валют
export const CURRENCIES: Currency[] = [
  'RUB', 'USD', 'EUR', 'KZT', 'BYN', 
  'GEL', 'AMD', 'UZS', 'KGS', 'TJS',
  'TRY', 'AED', 'CNY', 'USDT'
];

// Цвета для выбора
export const WALLET_COLORS: WalletColor[] = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#14B8A6', '#3B82F6',
  '#6B7280', '#84CC16'
];

// Иконки для выбора
export const WALLET_ICONS: { value: WalletIcon; label: string }[] = [
  { value: 'card', label: 'Карта' },
  { value: 'cash', label: 'Наличные' },
  { value: 'bank', label: 'Банк' },
  { value: 'safe', label: 'Копилка' },
  { value: 'crypto', label: 'Крипто' },
  { value: 'sber', label: 'Сбер' },
  { value: 'tinkoff', label: 'Тинькофф' },
  { value: 'home', label: 'Дом' },
  { value: 'wallet', label: 'Кошелек' },
  { value: 'treasure', label: 'Сокровище' },
  { value: 'money-bag', label: 'Мешок денег' },
  { value: 'diamond', label: 'Драгоценность' },
  { value: 'gift', label: 'Подарок' },
  { value: 'briefcase', label: 'Портфель' },
  { value: 'coin', label: 'Монета' },
  { value: 'bills', label: 'Купюры' },
  { value: 'vault', label: 'Сейф' },
  { value: 'investment', label: 'Инвестиции' },
  { value: 'savings', label: 'Сбережения' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 't-bank', label: 'Т-Банк' },
  { value: 'sberbank', label: 'Сбербанк' },
  { value: 'gazprombank', label: 'Газпромбанк' },
  { value: 'rosselhozbank', label: 'Россельхозбанк' },
  { value: 'vtb', label: 'ВТБ' }
];

export interface Wallet {
  id: string;
  name: string;
  icon: WalletIcon;
  color: WalletColor;
  currency: Currency;
  balance: number;
  // Для обратной совместимости (удалить после миграции)
  type?: 'cash' | 'card';
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  walletId: string;
  category: string;
  comment?: string;
  createdAt?: string; // ISO string для сортировки по времени
  // Поля для переводов
  toWalletId?: string; // Кошелек назначения (для transfer)
  toAmount?: number; // Сумма зачисления (для мультивалютных переводов)
}

// ============ Дела / To-Do ============
export type TaskPriority = 'normal' | 'important';
export type TaskTimeEstimate = 5 | 15 | 30 | 60 | null;

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date?: string; // YYYY-MM-DD, если пусто - "Когда-нибудь"
  priority: TaskPriority;
  timeEstimate?: TaskTimeEstimate;
  parentId?: string; // для подзадач
  createdAt?: string; // ISO string дата создания
  completedAt?: string; // ISO string дата выполнения
}

// ============ Привычки (HabitKit style) ============
export type HabitIcon = 
  | 'book' | 'coding' | 'workout' | 'run' | 'meditate'
  | 'drink-water' | 'sleep' | 'study' | 'reading' | 'finance'
  | 'clean' | 'music' | 'walking' | 'yoga' | 'writing'
  | 'cooking' | 'diet' | 'focus' | 'no-phone' | 'mood' | 'heart';

export type HabitColor = 
  | '#2f04fd' | '#cdc94e' | '#70cb19' | '#fa553f'
  | '#cdef1e' | '#13b4ff' | '#ff8c00' | '#bb29e8';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  icon: HabitIcon;
  color: HabitColor;
  records: string[]; // массив дат YYYY-MM-DD
  streak: number;
  bestStreak: number;
  createdAt: string; // ISO string
}

// ============ Инбокс ============
export type IdeaStatus = 'active' | 'processed';

export interface Idea {
  id: string;
  text: string;
  createdAt: string; // ISO string
  status: IdeaStatus;
}

// ============ Профиль ============
export interface Profile {
  name: string;
  bio?: string;
  goals: string[];
  avatar?: string; // base64 изображение
}

// ============ Настройки ============
export type Theme = 'light' | 'dark';

// Режим стартовой страницы
export type StartPageMode = 'default' | 'last' | 'custom';

// Доступные страницы для выбора
export type AppPage = '/' | '/finance' | '/tasks' | '/inbox' | '/profile';

export interface Settings {
  theme: Theme;
  startPageMode?: StartPageMode;
  customStartPage?: AppPage;
  lastVisitedPage?: string; // Для режима "последняя открытая"
}

// ============ Документы ============
export interface Document {
  id: string;
  name: string;
  imageBase64?: string;
}

// ============ Фокус-режим ============
export interface FocusSession {
  id: string;
  taskId: string;
  taskTitle: string;
  duration: number; // в секундах
  date: string; // ISO string
  completed: boolean;
}

// Состояние таймера Помодоро (для сохранения между страницами)
export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface TimerState {
  mode: TimerMode;
  timeLeft: number; // в секундах
  isRunning: boolean;
  sessionsCompleted: number;
  currentTask: string;
  focusDuration: number; // в минутах
  startedAt?: number; // timestamp когда был запущен таймер
}

// ============ Главное состояние ============
export interface AppState {
  // День
  routines: Routine[];
  events: Event[];
  dayTasks: Record<string, DayTask[]>; // дата -> 3 главные задачи дня
  
  // Финансы
  wallets: Wallet[];
  transactions: Transaction[];
  categories: string[];
  
  // Дела
  tasks: Task[];
  habits: Habit[];
  
  // Инбокс
  ideas: Idea[];
  
  // Профиль
  profile: Profile;
  documents: Document[];
  
  // Статистика
  focusSessions: FocusSession[];
  
  // Таймер Помодоро
  timerState?: TimerState;
  
  // Настройки
  settings: Settings;
}

export const defaultCategories = [
  'Еда',
  'Транспорт',
  'Развлечения',
  'Здоровье',
  'Одежда',
  'Подписки',
  'Зарплата',
  'Подарки',
  'Другое'
];

export const initialState: AppState = {
  routines: [],
  events: [],
  dayTasks: {},
  wallets: [
    { 
      id: 'wallet-cash', 
      name: 'Наличные', 
      icon: 'cash',
      color: '#10B981',
      currency: 'RUB',
      balance: 0 
    },
    { 
      id: 'wallet-card', 
      name: 'Карта', 
      icon: 'card',
      color: '#3B82F6',
      currency: 'RUB',
      balance: 0 
    }
  ],
  transactions: [],
  categories: defaultCategories,
  tasks: [],
  habits: [],
  ideas: [],
  profile: {
    name: '',
    bio: '',
    goals: []
  },
  documents: [],
  focusSessions: [],
  timerState: undefined,
  settings: {
    theme: 'light'
  }
};

// Функция миграции старых кошельков к новому формату
export function migrateWallets(wallets: Wallet[], transactions: Transaction[]): { wallets: Wallet[], transactions: Transaction[] } {
  // Проверяем, нужна ли миграция (старые кошельки имеют type, но не имеют icon)
  const needsMigration = wallets.some(w => (w as any).type && !w.icon);
  
  if (!needsMigration) {
    return { wallets, transactions };
  }
  
  // Создаём два кошелька: Наличные и Карта
  const cashWallet: Wallet = {
    id: 'wallet-cash-migrated',
    name: 'Наличные',
    icon: 'cash',
    color: '#10B981',
    currency: 'RUB',
    balance: wallets.find(w => (w as any).type === 'cash')?.balance || 0
  };
  
  const cardWallet: Wallet = {
    id: 'wallet-card-migrated',
    name: 'Карта',
    icon: 'card',
    color: '#3B82F6',
    currency: 'RUB',
    balance: wallets.find(w => (w as any).type === 'card')?.balance || 
             wallets.reduce((sum, w) => sum + w.balance, 0) - cashWallet.balance
  };
  
  // Обновляем все транзакции, привязывая к кошельку карты
  const migratedTransactions = transactions.map(tx => ({
    ...tx,
    walletId: 'wallet-card-migrated'
  }));
  
  return {
    wallets: [cashWallet, cardWallet],
    transactions: migratedTransactions
  };
}

