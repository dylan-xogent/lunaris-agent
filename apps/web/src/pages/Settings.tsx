import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { Moon, Sun, Monitor, Mail, Bell, AlertTriangle, Check, User, Shield, Database, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light" | "system";

export default function Settings() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);

  return (
    <MainLayout title="Settings" subtitle="Configure your console preferences and integrations">
      <div className="max-w-5xl space-y-8">
        {/* Saved indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 text-success">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">All changes saved</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Moon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Appearance</h3>
                <p className="text-sm text-muted-foreground">Customize the console theme</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "dark" as Theme, icon: Moon, label: "Dark" },
                { id: "light" as Theme, icon: Sun, label: "Light" },
                { id: "system" as Theme, icon: Monitor, label: "System" },
              ].map((option) => (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTheme(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-300",
                    theme === option.id
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-border"
                  )}
                >
                  <option.icon className={cn(
                    "w-6 h-6",
                    theme === option.id ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    theme === option.id ? "text-primary" : "text-muted-foreground"
                  )}>
                    {option.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <p className="text-sm text-muted-foreground">Configure alert preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { icon: Mail, label: "Email Alerts", desc: "Receive notifications via email", value: emailAlerts, onChange: setEmailAlerts },
                { icon: Bell, label: "In-App Alerts", desc: "Show notifications in the console", value: inAppAlerts, onChange: setInAppAlerts },
                { icon: AlertTriangle, label: "Critical Only", desc: "Only notify for critical updates", value: criticalOnly, onChange: setCriticalOnly },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch checked={item.value} onCheckedChange={item.onChange} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <User className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Profile</h3>
                <p className="text-sm text-muted-foreground">Manage your account</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Administrator</p>
                <p className="text-sm text-muted-foreground">admin@lunaris.local</p>
              </div>
              <button className="text-sm text-primary font-medium hover:underline">
                Edit Profile
              </button>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Security</h3>
                <p className="text-sm text-muted-foreground">Access and authentication</p>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors text-left">
                <span className="text-sm font-medium text-foreground">Change Password</span>
                <span className="text-muted-foreground">→</span>
              </button>
              <button className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors text-left">
                <span className="text-sm font-medium text-foreground">Two-Factor Authentication</span>
                <span className="px-2 py-0.5 text-xs rounded-md bg-success/10 text-success">Enabled</span>
              </button>
              <button className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors text-left">
                <span className="text-sm font-medium text-foreground">API Keys</span>
                <span className="text-muted-foreground">→</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">About Lunaris</h3>
              <p className="text-sm text-muted-foreground">Console information and version</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Console Version", value: "v2.0.0" },
              { label: "API Version", value: "v1.2.0" },
              { label: "Build", value: "2025.12.09" },
              { label: "Environment", value: "Production" },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="p-4 rounded-xl border border-border/50 bg-secondary/20"
              >
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className="font-mono font-semibold text-foreground">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
