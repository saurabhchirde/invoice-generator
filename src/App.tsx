import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AppProvider } from './context/AppContext';
import ListPage from './pages/ListPage';
import FormPage from './pages/FormPage';
import PreviewPage from './pages/PreviewPage';
import SettingsRoutePage from './pages/SettingsRoutePage';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen bg-gray-50">
          <Toaster />
          <Routes>
            <Route path="/" element={<ListPage />} />
            <Route path="/invoice/new" element={<FormPage />} />
            <Route path="/invoice/:id" element={<FormPage />} />
            <Route path="/invoice/:id/preview" element={<PreviewPage />} />
            <Route path="/settings" element={<SettingsRoutePage />} />
          </Routes>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
