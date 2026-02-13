import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Bell, Shield, Database, Palette, Languages } from 'lucide-react';
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";
import { useLanguage } from "@/components/language-provider";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const handleSave = () => {
    toast.success(t('config_saved'), {
      description: t('config_saved_desc'),
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>
          <p className="text-muted-foreground">{t('general')}</p>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              {t('general')}
            </CardTitle>
            <CardDescription>{t('general_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-name">{t('company_name')}</Label>
                <Input
                  id="company-name"
                  defaultValue="Sistema Industrial"
                  placeholder={t('company_name_placeholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">{t('timezone')}</Label>
                <Select defaultValue="america-mexico">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="america-mexico">América/México</SelectItem>
                    <SelectItem value="america-new-york">América/Nueva York</SelectItem>
                    <SelectItem value="europe-madrid">Europa/Madrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refresh-interval">{t('refresh_interval')}</Label>
              <Input
                id="refresh-interval"
                type="number"
                defaultValue="30"
                min="5"
                max="300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('notifications')}
            </CardTitle>
            <CardDescription>{t('notifications_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('maintenance_alerts')}</Label>
                <p className="text-sm text-muted-foreground">{t('maintenance_alerts_desc')}</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('temperature_alerts')}</Label>
                <p className="text-sm text-muted-foreground">{t('temperature_alerts_desc')}</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('daily_reports')}</Label>
                <p className="text-sm text-muted-foreground">{t('daily_reports_desc')}</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('security')}
            </CardTitle>
            <CardDescription>{t('security_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">{t('session_timeout')}</Label>
              <Input
                id="session-timeout"
                type="number"
                defaultValue="60"
                min="15"
                max="480"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('2fa')}</Label>
                <p className="text-sm text-muted-foreground">{t('2fa_desc')}</p>
              </div>
              <Switch />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('audit_log')}</Label>
                <p className="text-sm text-muted-foreground">{t('audit_log_desc')}</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t('api')}
            </CardTitle>
            <CardDescription>{t('api_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-endpoint">{t('api_endpoint')}</Label>
              <Input
                id="api-endpoint"
                defaultValue="https://api.empresa.com/v1"
                placeholder={t('api_endpoint_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-timeout">{t('api_timeout')}</Label>
              <Input
                id="api-timeout"
                type="number"
                defaultValue="30"
                min="5"
                max="120"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('auto_retries')}</Label>
                <p className="text-sm text-muted-foreground">{t('auto_retries_desc')}</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('appearance')}
            </CardTitle>
            <CardDescription>{t('appearance_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">{t('theme')}</Label>
              <Select value={theme} onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('light')}</SelectItem>
                  <SelectItem value="dark">{t('dark')}</SelectItem>
                  <SelectItem value="system">{t('system')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">{t('language')}</Label>
              <Select value={language} onValueChange={(value: "es" | "en") => setLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            {t('save_configuration')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;