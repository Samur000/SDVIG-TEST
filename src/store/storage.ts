/**
 * Модуль хранения данных приложения СДВиГ
 * 
 * ВАЖНО: С версии 2.0 данные хранятся в IndexedDB, а не в localStorage.
 * localStorage используется только для:
 * - Флага миграции (data_migrated_to_indexeddb)
 * - Легковесных настроек если нужно
 * 
 * Этот модуль предоставляет унифицированный интерфейс для работы с хранилищем.
 */

import { AppState, initialState } from '../types';
import { 
  initializeStorage, 
  saveStateToDB, 
  loadStateFromDB,
  clearStateInDB,
  isIndexedDBAvailable 
} from './indexedDB';

// Старый ключ localStorage (только для fallback)
const LEGACY_STORAGE_KEY = 'sdvig-app-state';

/**
 * Инициализирует хранилище и загружает состояние
 * Выполняет миграцию из localStorage в IndexedDB при первом запуске
 * 
 * Это АСИНХРОННАЯ функция - необходимо дождаться её завершения
 */
export async function initStorage(): Promise<AppState> {
  // Проверяем доступность IndexedDB
  if (!isIndexedDBAvailable()) {
    console.warn('IndexedDB недоступен, используем localStorage');
    return loadStateLegacy();
  }
  
  return initializeStorage();
}

/**
 * Загружает состояние из хранилища (IndexedDB)
 * АСИНХРОННАЯ функция
 */
export async function loadStateAsync(): Promise<AppState> {
  if (!isIndexedDBAvailable()) {
    return loadStateLegacy();
  }
  
  try {
    return await loadStateFromDB();
  } catch (error) {
    console.error('Ошибка загрузки из IndexedDB, fallback на localStorage:', error);
    return loadStateLegacy();
  }
}

/**
 * Сохраняет состояние в хранилище (IndexedDB)
 * АСИНХРОННАЯ функция
 */
export async function saveStateAsync(state: AppState): Promise<boolean> {
  if (!isIndexedDBAvailable()) {
    return saveStateLegacy(state);
  }
  
  try {
    return await saveStateToDB(state);
  } catch (error) {
    console.error('Ошибка сохранения в IndexedDB, fallback на localStorage:', error);
    return saveStateLegacy(state);
  }
}

/**
 * Очищает хранилище
 */
export async function clearStorage(): Promise<void> {
  if (isIndexedDBAvailable()) {
    await clearStateInDB();
  }
  // Не очищаем localStorage - там хранится флаг миграции
}

// ============ Legacy функции для совместимости и fallback ============

/**
 * @deprecated Используйте loadStateAsync()
 * Синхронная загрузка из localStorage (только для fallback)
 */
export function loadState(): AppState {
  return loadStateLegacy();
}

/**
 * @deprecated Используйте saveStateAsync()
 * Синхронная запись в localStorage (только для fallback)
 */
export function saveState(state: AppState): boolean {
  return saveStateLegacy(state);
}

/**
 * Загрузка из localStorage (legacy/fallback)
 */
function loadStateLegacy(): AppState {
  try {
    const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialState, ...parsed };
    }
  } catch (error) {
    console.error('Ошибка загрузки из localStorage:', error);
  }
  return initialState;
}

/**
 * Сохранение в localStorage (legacy/fallback)
 */
function saveStateLegacy(state: AppState): boolean {
  try {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Ошибка сохранения в localStorage:', error);
    return false;
  }
}

/**
 * @deprecated 
 * Очистка localStorage
 */
export function clearState(): void {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.error('Ошибка очистки localStorage:', error);
  }
}
