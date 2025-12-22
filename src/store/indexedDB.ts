/**
 * Модуль работы с IndexedDB для приложения СДВиГ
 * 
 * Архитектура:
 * - База данных: 'sdvig-db'
 * - Object Store: 'appState' — хранит полное состояние приложения
 * - Ключ: 'main' — единственная запись с полным состоянием
 * 
 * Этот подход сохраняет текущую архитектуру приложения,
 * где всё состояние хранится как единый объект.
 */

import { AppState, initialState, Habit } from '../types';

/**
 * Нормализует данные привычки, добавляя отсутствующие поля
 */
function normalizeHabit(habit: Partial<Habit>): Habit {
  return {
    id: habit.id || '',
    title: habit.title || '',
    description: habit.description,
    icon: habit.icon || 'book',
    color: habit.color || '#2f04fd',
    records: Array.isArray(habit.records) ? habit.records : [],
    streak: typeof habit.streak === 'number' ? habit.streak : 0,
    bestStreak: typeof habit.bestStreak === 'number' ? habit.bestStreak : 0,
    createdAt: habit.createdAt || new Date().toISOString(),
  };
}

/**
 * Нормализует состояние приложения после импорта/загрузки
 * Добавляет отсутствующие поля и исправляет структуру данных
 */
function normalizeState(state: Partial<AppState>): AppState {
  const normalized: AppState = { ...initialState, ...state };
  
  // Нормализуем привычки
  if (Array.isArray(normalized.habits)) {
    normalized.habits = normalized.habits.map(normalizeHabit);
  } else {
    normalized.habits = [];
  }
  
  // Нормализуем профиль
  if (!normalized.profile || typeof normalized.profile !== 'object') {
    normalized.profile = initialState.profile;
  } else {
    normalized.profile = {
      name: normalized.profile.name || '',
      bio: normalized.profile.bio || '',
      goals: Array.isArray(normalized.profile.goals) ? normalized.profile.goals : [],
      avatar: normalized.profile.avatar,
    };
  }
  
  // Нормализуем массивы
  if (!Array.isArray(normalized.tasks)) normalized.tasks = [];
  if (!Array.isArray(normalized.wallets)) normalized.wallets = initialState.wallets;
  if (!Array.isArray(normalized.transactions)) normalized.transactions = [];
  if (!Array.isArray(normalized.documents)) normalized.documents = [];
  if (!Array.isArray(normalized.focusSessions)) normalized.focusSessions = [];
  if (!Array.isArray(normalized.ideas)) normalized.ideas = [];
  if (!Array.isArray(normalized.routines)) normalized.routines = [];
  if (!Array.isArray(normalized.events)) normalized.events = [];
  
  return normalized;
}

const DB_NAME = 'sdvig-db';
const DB_VERSION = 1;
const STORE_NAME = 'appState';
const STATE_KEY = 'main';

// Флаг миграции в localStorage
const MIGRATION_FLAG = 'data_migrated_to_indexeddb';
// Старый ключ localStorage (для миграции)
const LEGACY_STORAGE_KEY = 'sdvig-app-state';

let dbInstance: IDBDatabase | null = null;

/**
 * Открывает соединение с базой данных IndexedDB
 * Создаёт object store при первом запуске
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Если соединение уже открыто, возвращаем его
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Ошибка открытия IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      
      // Обработка закрытия соединения
      dbInstance.onclose = () => {
        dbInstance = null;
      };
      
      resolve(dbInstance);
    };

    // Создание/обновление структуры базы данных
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Создаём object store для состояния приложения
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
        console.log('IndexedDB: создан object store', STORE_NAME);
      }
    };
  });
}

/**
 * Загружает состояние приложения из IndexedDB
 * Возвращает initialState если данных нет
 */
export async function loadStateFromDB(): Promise<AppState> {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(STATE_KEY);

      request.onerror = () => {
        console.error('Ошибка чтения из IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        if (request.result) {
          // Нормализуем данные для добавления новых полей и исправления структуры
          const normalizedState = normalizeState(request.result);
          resolve(normalizedState);
        } else {
          // Данных нет - возвращаем начальное состояние
          resolve(initialState);
        }
      };
    });
  } catch (error) {
    console.error('Ошибка загрузки состояния из IndexedDB:', error);
    return initialState;
  }
}

/**
 * Сохраняет состояние приложения в IndexedDB
 */
export async function saveStateToDB(state: AppState): Promise<boolean> {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(state, STATE_KEY);

      request.onerror = () => {
        console.error('Ошибка записи в IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(true);
      };

      transaction.onerror = () => {
        console.error('Ошибка транзакции IndexedDB:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Ошибка сохранения состояния в IndexedDB:', error);
    return false;
  }
}

/**
 * Очищает состояние в IndexedDB
 */
export async function clearStateInDB(): Promise<void> {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(STATE_KEY);

      request.onerror = () => {
        console.error('Ошибка удаления из IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('Ошибка очистки IndexedDB:', error);
  }
}

/**
 * Проверяет, была ли выполнена миграция
 */
export function isMigrationDone(): boolean {
  return localStorage.getItem(MIGRATION_FLAG) === 'true';
}

/**
 * Выполняет миграцию данных из localStorage в IndexedDB
 * Запускается один раз при первом запуске новой версии
 * 
 * Логика:
 * 1. Проверяем флаг миграции
 * 2. Если миграция не выполнена - читаем данные из localStorage
 * 3. Сохраняем в IndexedDB
 * 4. Ставим флаг миграции
 * 5. Данные в localStorage НЕ удаляем (остаются как резерв)
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
  // Если миграция уже выполнена - пропускаем
  if (isMigrationDone()) {
    console.log('IndexedDB: миграция уже выполнена ранее');
    return true;
  }

  console.log('IndexedDB: начинаем миграцию из localStorage...');

  try {
    // Читаем данные из старого localStorage
    const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
    
    if (!legacyData) {
      // Данных нет - это новый пользователь или пустое хранилище
      console.log('IndexedDB: данных в localStorage нет, миграция не требуется');
      localStorage.setItem(MIGRATION_FLAG, 'true');
      return true;
    }

    // Парсим данные
    const parsedData = JSON.parse(legacyData) as Partial<AppState>;
    
    // Нормализуем данные для обеспечения полноты структуры
    const fullState: AppState = normalizeState(parsedData);

    // Сохраняем в IndexedDB
    const saved = await saveStateToDB(fullState);
    
    if (!saved) {
      console.error('IndexedDB: ошибка сохранения при миграции');
      return false;
    }

    // Ставим флаг успешной миграции
    localStorage.setItem(MIGRATION_FLAG, 'true');
    
    console.log('IndexedDB: миграция успешно завершена');
    console.log('IndexedDB: данные в localStorage сохранены как резерв');
    
    return true;
  } catch (error) {
    // При любой ошибке НЕ ставим флаг миграции
    console.error('IndexedDB: ошибка миграции:', error);
    return false;
  }
}

/**
 * Инициализирует IndexedDB и выполняет миграцию при необходимости
 * Возвращает загруженное состояние
 */
export async function initializeStorage(): Promise<AppState> {
  try {
    // Открываем базу данных (создаётся при первом запуске)
    await openDatabase();
    
    // Выполняем миграцию если нужно
    const migrationSuccess = await migrateFromLocalStorage();
    
    if (!migrationSuccess) {
      console.warn('IndexedDB: миграция не удалась, пробуем загрузить из localStorage');
      // Fallback на localStorage если миграция не удалась
      const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyData) {
        return normalizeState(JSON.parse(legacyData));
      }
      return initialState;
    }
    
    // Загружаем состояние из IndexedDB
    const state = await loadStateFromDB();
    return state;
  } catch (error) {
    console.error('IndexedDB: ошибка инициализации:', error);
    
    // Fallback на localStorage при критической ошибке
    try {
      const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyData) {
        console.log('IndexedDB: используем fallback на localStorage');
        return normalizeState(JSON.parse(legacyData));
      }
    } catch {
      // Игнорируем ошибки fallback
    }
    
    return initialState;
  }
}

/**
 * Экспортирует все данные из IndexedDB в JSON-объект
 * Используется для функции бэкапа
 */
export async function exportAllData(): Promise<Record<string, unknown>> {
  try {
    const state = await loadStateFromDB();
    
    // Формируем объект для экспорта с метаданными
    return {
      _exportVersion: 2, // Версия формата экспорта (2 = IndexedDB)
      _exportDate: new Date().toISOString(),
      _appVersion: '2.0',
      appState: state
    };
  } catch (error) {
    console.error('Ошибка экспорта данных:', error);
    throw error;
  }
}

/**
 * Импортирует данные из JSON-объекта в IndexedDB
 * Полностью перезаписывает существующие данные
 * 
 * Поддерживает два формата:
 * 1. Старый формат (из localStorage): { sdvig-app-state: {...} }
 * 2. Новый формат (из IndexedDB): { appState: {...}, _exportVersion: 2 }
 */
export async function importAllData(data: Record<string, unknown>): Promise<AppState> {
  try {
    let rawState: Partial<AppState>;
    
    // Определяем формат импортируемых данных
    if (data._exportVersion === 2 && data.appState) {
      // Новый формат (IndexedDB export)
      console.log('Импорт: обнаружен новый формат (v2)');
      rawState = data.appState as Partial<AppState>;
    } else if (data[LEGACY_STORAGE_KEY]) {
      // Старый формат (localStorage export) - ключ sdvig-app-state
      console.log('Импорт: обнаружен старый формат (localStorage)');
      rawState = data[LEGACY_STORAGE_KEY] as Partial<AppState>;
    } else {
      // Попытка импортировать как прямой объект состояния
      console.log('Импорт: попытка прямого импорта');
      rawState = data as Partial<AppState>;
    }
    
    // Нормализуем данные (добавляем отсутствующие поля, исправляем структуру)
    const stateToImport = normalizeState(rawState);
    
    // Сохраняем в IndexedDB
    const saved = await saveStateToDB(stateToImport);
    
    if (!saved) {
      throw new Error('Не удалось сохранить импортированные данные');
    }
    
    console.log('Импорт данных успешно завершён');
    return stateToImport;
  } catch (error) {
    console.error('Ошибка импорта данных:', error);
    throw error;
  }
}

/**
 * Проверяет доступность IndexedDB
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}


