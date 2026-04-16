import { useMemo, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { AppProvider } from "./context/AppContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { isFirebaseEnabled } from "./lib/firebase";
import { LocalStorageAdapter } from "./lib/storageAdapter";
import { FirestoreAdapter } from "./lib/firestoreAdapter";
import { syncLocalDataToFirestore } from "./lib/syncData";
import ListPage from "./pages/ListPage";
import FormPage from "./pages/FormPage";
import PreviewPage from "./pages/PreviewPage";
import SettingsRoutePage from "./pages/SettingsRoutePage";

function AppWithAdapter() {
  const { user, isGuest } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  const adapter = useMemo(() => {
    // Use Firestore only if Firebase is enabled AND user is logged in (not a guest)
    if (isFirebaseEnabled && user && !isGuest)
      return new FirestoreAdapter(user.uid);
    return new LocalStorageAdapter();
  }, [user?.uid, isGuest]); // reconstruct adapter when user or guest mode changes

  // When user logs in from guest mode, sync local data to Firestore
  useEffect(() => {
    if (!isFirebaseEnabled || !user || isGuest || isSyncing) return;

    const performSync = async () => {
      setIsSyncing(true);
      try {
        // Load local storage data
        const localAdapter = new LocalStorageAdapter();
        const localInvoices = await localAdapter.loadInvoices();
        const localSettings = await localAdapter.loadSettings();

        // Only sync if there's data to sync
        if (localInvoices.length > 0 || localSettings.businessName) {
          await syncLocalDataToFirestore(
            user.uid,
            localInvoices,
            localSettings,
            {
              displayName: user.displayName ?? null,
              email: user.email ?? null,
            },
          );
          toast.success(`Synced ${localInvoices.length} invoices to cloud!`);
        }
      } catch (error) {
        console.error("Sync failed:", error);
        toast.error("Failed to sync data to cloud. Please try again.");
      } finally {
        setIsSyncing(false);
      }
    };

    performSync();
  }, [user?.uid, isGuest]);

  return (
    <AppProvider adapter={adapter}>
      <AuthGuard>
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
      </AuthGuard>
    </AppProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppWithAdapter />
      </AuthProvider>
    </BrowserRouter>
  );
}
