import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Invoice } from '../components/InvoiceForm';
import { BusinessSettings, loadSettings, saveSettings } from '../types/settings';

interface AppContextType {
  invoices: Invoice[];
  saveInvoice: (invoice: Invoice) => 'created' | 'updated';
  deleteInvoice: (id: string) => void;
  settings: BusinessSettings;
  updateSettings: (patch: Partial<BusinessSettings>) => void;
  persistSettings: () => void;
}

const AppContext = createContext<AppContextType>(null!);

export function AppProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try { return JSON.parse(localStorage.getItem('invoices') || '[]'); } catch { return []; }
  });
  const [settings, setSettings] = useState<BusinessSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);

  const saveInvoice = (invoice: Invoice): 'created' | 'updated' => {
    let result: 'created' | 'updated' = 'created';
    setInvoices(prev => {
      const idx = prev.findIndex(i => i.id === invoice.id);
      if (idx >= 0) {
        result = 'updated';
        const updated = [...prev];
        updated[idx] = invoice;
        return updated;
      }
      return [...prev, invoice];
    });
    return result;
  };

  const deleteInvoice = (id: string) =>
    setInvoices(prev => prev.filter(i => i.id !== id));

  const updateSettings = (patch: Partial<BusinessSettings>) =>
    setSettings(prev => ({ ...prev, ...patch }));

  const persistSettings = () => saveSettings(settings);

  return (
    <AppContext.Provider value={{ invoices, saveInvoice, deleteInvoice, settings, updateSettings, persistSettings }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
