import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { ToastProvider } from './components/UI';
import { DayPage } from './pages/Day';
import { FinancePage } from './pages/Finance';
import { TasksPage } from './pages/Tasks';
import { InboxPage } from './pages/Inbox';
import { ProfilePage, SettingsPage } from './pages/Profile';

const basename = import.meta.env.BASE_URL;

export function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter basename={basename}>
          <Routes>
            <Route path="/" element={<DayPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  );
}

export default App;

