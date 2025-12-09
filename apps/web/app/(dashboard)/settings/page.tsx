"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, saveSettings } from "@/lib/api";
import { Settings } from "@/lib/types";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  Mail,
  AlertTriangle,
  Save,
  RefreshCw,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<Settings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setHasChanges(false);
    },
  });

  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings);
    }
  }, [settings, localSettings]);

  const updateSettings = (updates: Partial<Settings>) => {
    if (localSettings) {
      setLocalSettings({ ...localSettings, ...updates });
      setHasChanges(true);
    }
  };

  const updateNotifications = (updates: Partial<Settings["notifications"]>) => {
    if (localSettings) {
      setLocalSettings({
        ...localSettings,
        notifications: { ...localSettings.notifications, ...updates },
      });
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    if (localSettings) {
      save(localSettings);
    }
  };

  const handleReset = () => {
    if (settings) {
      setLocalSettings(settings);
      setHasChanges(false);
    }
  };

  if (isLoading || !localSettings) {
    return (
      <>
        <Header title="Settings" />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      </>
    );
  }

  const themeIcons = {
    dark: Moon,
    light: Sun,
    system: Monitor,
  };

  return (
    <>
      <Header title="Settings" />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <p className="text-slate-400">
              Manage your console preferences and notifications
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Reset
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="bg-cyan-600 text-white hover:bg-cyan-700"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : hasChanges ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Saved
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Theme Settings */}
          <Card className="border-slate-800/50 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Moon className="h-5 w-5 text-cyan-400" />
                Appearance
              </CardTitle>
              <CardDescription className="text-slate-400">
                Customize how the console looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-slate-300">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["dark", "light", "system"] as const).map((theme) => {
                    const ThemeIcon = themeIcons[theme];
                    const isSelected = localSettings.theme === theme;
                    return (
                      <button
                        key={theme}
                        onClick={() => updateSettings({ theme })}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                          isSelected
                            ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                            : "border-slate-800 bg-slate-800/30 text-slate-400 hover:border-slate-700 hover:bg-slate-800/50"
                        )}
                      >
                        <ThemeIcon className="h-6 w-6" />
                        <span className="text-sm font-medium capitalize">
                          {theme}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-slate-800/50 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bell className="h-5 w-5 text-cyan-400" />
                Notifications
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure how you receive alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-800 p-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <Label className="text-slate-300">Email Alerts</Label>
                    <p className="text-sm text-slate-500">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.notifications.emailAlerts}
                  onCheckedChange={(checked) =>
                    updateNotifications({ emailAlerts: checked })
                  }
                  className="data-[state=checked]:bg-cyan-600"
                />
              </div>

              <Separator className="bg-slate-800" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-800 p-2">
                    <Bell className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <Label className="text-slate-300">In-App Alerts</Label>
                    <p className="text-sm text-slate-500">
                      Show notifications in the console
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.notifications.inAppAlerts}
                  onCheckedChange={(checked) =>
                    updateNotifications({ inAppAlerts: checked })
                  }
                  className="data-[state=checked]:bg-cyan-600"
                />
              </div>

              <Separator className="bg-slate-800" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-slate-800 p-2">
                    <AlertTriangle className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <Label className="text-slate-300">Critical Only</Label>
                    <p className="text-sm text-slate-500">
                      Only notify for critical updates
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.notifications.criticalOnly}
                  onCheckedChange={(checked) =>
                    updateNotifications({ criticalOnly: checked })
                  }
                  className="data-[state=checked]:bg-cyan-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          <Card className="border-slate-800/50 bg-slate-900/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Monitor className="h-5 w-5 text-cyan-400" />
                About
              </CardTitle>
              <CardDescription className="text-slate-400">
                Console information and version
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-800/50 bg-slate-800/30 p-4">
                  <p className="text-sm text-slate-500">Console Version</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-white">
                    v1.0.0
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800/50 bg-slate-800/30 p-4">
                  <p className="text-sm text-slate-500">API Version</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-white">
                    v1.0.0
                  </p>
                </div>
                <div className="rounded-lg border border-slate-800/50 bg-slate-800/30 p-4">
                  <p className="text-sm text-slate-500">Build</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-slate-400">
                    2024.12.09
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

