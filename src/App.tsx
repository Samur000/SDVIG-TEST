import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { ToastProvider } from './components/UI';
import { DayPage } from './pages/Day';
import { CalendarPage } from './pages/Day/CalendarPage';
import { FinancePage } from './pages/Finance';
import { TasksPage } from './pages/Tasks';
import { InboxPage } from './pages/Inbox';
import { ProfilePage, SettingsPage } from './pages/Profile';
import { FocusPage } from './pages/Focus';

const basename = import.meta.env.BASE_URL;

// Компонент для отслеживания маршрутов и редиректа при запуске
function RouteTracker() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const hasRedirected = useRef(false);
  const isInitialMount = useRef(true);
  
  // Редирект при первом запуске на основе настроек
  useEffect(() => {
    if (hasRedirected.current) return;
    
    const settings = state.settings;
    const mode = settings?.startPageMode || 'default';
    
    // Определяем целевую страницу
    let targetPage: string | undefined;
    
    switch (mode) {
      case 'last':
        targetPage = settings?.lastVisitedPage;
        break;
      case 'custom':
        targetPage = settings?.customStartPage;
        break;
      case 'default':
      default:
        targetPage = '/';
        break;
    }
    
    // Редиректим только если нужно и мы на главной странице
    if (targetPage && targetPage !== '/' && location.pathname === '/') {
      hasRedirected.current = true;
      navigate(targetPage, { replace: true });
    } else {
      hasRedirected.current = true;
    }
  }, [state.settings, navigate, location.pathname]);
  
  // Сохраняем последний посещённый маршрут при каждом переходе
  useEffect(() => {
    // Пропускаем первый рендер и страницу настроек (чтобы не запоминать её)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Не сохраняем страницу настроек как последнюю
    if (location.pathname === '/settings') return;
    
    // Сохраняем текущий путь
    const currentPath = location.pathname;
    if (state.settings?.lastVisitedPage !== currentPath) {
      dispatch({ type: 'SET_LAST_VISITED_PAGE', payload: currentPath });
    }
  }, [location.pathname, dispatch, state.settings?.lastVisitedPage]);
  
  return null;
}

// Внутренний компонент с роутами
function AppRoutes() {
  return (
    <>
      <RouteTracker />
      <Routes>
        <Route path="/" element={<DayPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/focus" element={<FocusPage />} />
      </Routes>
    </>
  );
}

export function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter basename={basename}>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  );
}

export default App;

