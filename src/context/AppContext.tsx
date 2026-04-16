import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { Invoice } from "../components/InvoiceForm";
import { BusinessSettings } from "../types/settings";
import { DEFAULT_SETTINGS, StorageAdapter } from "../lib/storageAdapter";

interface AppContextType {
  invoices: Invoice[];
  saveInvoice: (invoice: Invoice) => Promise<"created" | "updated">;
  deleteInvoice: (id: string) => Promise<void>;
  settings: BusinessSettings;
  updateSettings: (patch: Partial<BusinessSettings>) => void;
  persistSettings: () => Promise<void>;
  queueImageDeletion: (fn: () => Promise<void>) => void;
  dataLoading: boolean;
}

const AppContext = createContext<AppContextType>(null!);

export function AppProvider({
  adapter,
  children,
}: {
  adapter: StorageAdapter;
  children: ReactNode;
}) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [dataLoading, setDataLoading] = useState(true);
  const pendingDeletionsRef = useRef<Array<() => Promise<void>>>([]);

  useEffect(() => {
    setDataLoading(true);
    Promise.all([adapter.loadInvoices(), adapter.loadSettings()])
      .then(([invs, sett]) => {
        setInvoices(invs);
        setSettings(sett);
      })
      .finally(() => setDataLoading(false));
  }, [adapter]);

  const saveInvoice = async (
    invoice: Invoice,
  ): Promise<"created" | "updated"> => {
    const result = await adapter.saveInvoice(invoice);
    setInvoices((prev) => {
      const idx = prev.findIndex((i) => i.id === invoice.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = invoice;
        return updated;
      }
      return [...prev, invoice];
    });
    return result;
  };

  const deleteInvoice = async (id: string): Promise<void> => {
    await adapter.deleteInvoice(id);
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  const updateSettings = (patch: Partial<BusinessSettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  const queueImageDeletion = (fn: () => Promise<void>) => {
    pendingDeletionsRef.current.push(fn);
  };

  const persistSettings = async (): Promise<void> => {
    // Flush deferred Storage deletions only when the user explicitly saves
    const deletions = pendingDeletionsRef.current.splice(0);
    await Promise.all(deletions.map((fn) => fn().catch(() => {})));
    await adapter.persistSettings(settings);
  };

  return (
    <AppContext.Provider
      value={{
        invoices,
        saveInvoice,
        deleteInvoice,
        settings,
        updateSettings,
        persistSettings,
        queueImageDeletion,
        dataLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
