import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { SettingsPage } from "../components/SettingsPage";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsRoutePage() {
  const navigate = useNavigate();
  const { settings, updateSettings, persistSettings } = useApp();
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

  return (
    <div className="bg-white min-h-screen">
      <PageHeader
        onBack={() => navigate(-1)}
        title="Settings"
        actions={
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
        }
      />
      <SettingsPage settings={settings} onUpdate={updateSettings} />
    </div>
  );
}
