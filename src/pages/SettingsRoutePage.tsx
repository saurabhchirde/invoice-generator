import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { SettingsPage } from "../components/SettingsPage";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Save, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { isFirebaseEnabled } from "../lib/firebase";

export default function SettingsRoutePage() {
  const navigate = useNavigate();
  const { settings, updateSettings, persistSettings } = useApp();
  const { user, signOut } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await persistSettings();
      toast.success("Settings saved!");
      navigate("/");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings.");
      setSaving(false);
    }
  };

  // Navigate to "/" first so the URL is at home when LoginScreen renders.
  // Without this, after sign-out the URL stays at /settings and the user
  // lands back on Settings once they sign in or continue offline.
  const handleSignOut = async () => {
    navigate("/", { replace: true });
    await signOut();
  };

  return (
    <div className="bg-white min-h-screen">
      <PageHeader
        onBack={() => navigate(-1)}
        title="Settings"
        actions={
          <div className="flex items-center gap-2">
            {isFirebaseEnabled && user && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-red-500 hover:text-red-600 hover:border-red-200 border-red-100"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                <span className="hidden sm:inline">Saving…</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Save Settings</span>
              </>
            )}
          </Button>
          </div>
        }
      />
      <SettingsPage settings={settings} onUpdate={updateSettings} />
    </div>
  );
}
