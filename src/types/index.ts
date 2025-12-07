// ============ День / Расписание ============
export type DayOfWeek = 'пн' | 'вт' | 'ср' | 'чт' | 'пт' | 'сб' | 'вс';

export interface Routine {
  id: string;
  title: string;
  time?: string; // "09:00" или интервал "09:00-10:00"
  days: DayOfWeek[];
  icon?: string;
  completed: Record<string, boolean>; // дата -> выполнено
}

export interface Event {
  id: string;
  title: string;
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
export type WalletType = 'cash' | 'card';

export interface Wallet {
  id: string;
  type: WalletType;
  name: string;
  balance: number;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  walletId: string;
  category: string;
  comment?: string;
  createdAt?: string; // ISO string для сортировки по времени
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
  | 'cooking' | 'diet' | 'focus' | 'no-phone' | 'mood';

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

export interface Settings {
  theme: Theme;
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
    { id: 'wallet-cash', type: 'cash', name: 'Наличные', balance: 0 },
    { id: 'wallet-card', type: 'card', name: 'Карта', balance: 0 }
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
  settings: {
    theme: 'light'
  }
};

