import { motion } from "framer-motion";
import { RefreshCw, Download, Shield, Zap } from "lucide-react";

const actions = [
  {
    icon: RefreshCw,
    label: "Sync All",
    description: "Sync all devices",
    gradient: "from-primary to-cyan-400",
  },
  {
    icon: Download,
    label: "Deploy Updates",
    description: "Push pending updates",
    gradient: "from-accent to-purple-400",
  },
  {
    icon: Shield,
    label: "Security Scan",
    description: "Run fleet scan",
    gradient: "from-success to-emerald-400",
  },
  {
    icon: Zap,
    label: "Quick Action",
    description: "Run automation",
    gradient: "from-warning to-orange-400",
  },
];

interface QuickActionsProps {
  delay?: number;
}

export function QuickActions({ delay = 0 }: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="chart-card"
    >
      <div className="p-6 border-b border-border/30">
        <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Frequently used operations</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.1 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border/50 hover:border-primary/30 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center group-hover:shadow-lg transition-shadow`}>
                <action.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
