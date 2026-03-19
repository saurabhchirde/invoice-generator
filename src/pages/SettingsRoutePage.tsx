import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SettingsPage } from '../components/SettingsPage';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsRoutePage() {
  const navigate = useNavigate();
  const { settings, updateSettings, persistSettings } = useApp();

  const handleSave = () => {
    persistSettings();
    toast.success('Settings saved!');
    navigate('/');
  };

  return (
    <div className="bg-white min-h-screen">
      <PageHeader
        onBack={() => navigate(-1)}
        title="Settings"
        actions={
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Save Settings</span>
          </Button>
        }
      />
      <SettingsPage settings={settings} onUpdate={updateSettings} />
    </div>
  );
}
