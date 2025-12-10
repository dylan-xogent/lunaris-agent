import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Download, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CommandStatus {
  id: string;
  type: "sync" | "install";
  status: "pending" | "executing" | "completed" | "failed";
  message: string;
  timestamp: Date;
  packageCount?: number;
}

interface CommandStatusProps {
  commands: CommandStatus[];
  onDismiss?: (id: string) => void;
}

export function CommandStatus({ commands, onDismiss }: CommandStatusProps) {
  if (commands.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold text-foreground mb-1">No running actions</p>
          <p className="text-sm text-muted-foreground">All commands have completed</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Running actions</h3>
        <span className="px-3 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary">
          {commands.length} active
        </span>
      </div>
      <div className="space-y-3">
        <AnimatePresence>
          {commands.map((command) => (
            <motion.div
              key={command.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/30"
            >
              <div className="flex-shrink-0">
                {command.status === "pending" || command.status === "executing" ? (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                ) : command.status === "completed" ? (
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-destructive" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {command.type === "sync" ? (
                    <RefreshCw className="w-4 h-4 text-primary" />
                  ) : (
                    <Download className="w-4 h-4 text-primary" />
                  )}
                  <p className="font-medium text-foreground">
                    {command.type === "sync" ? "Device Sync" : `Installing ${command.packageCount || 0} update(s)`}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{command.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(command.timestamp, { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    command.status === "pending" || command.status === "executing"
                      ? "bg-primary/10 text-primary"
                      : command.status === "completed"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {command.status === "pending"
                    ? "Queued"
                    : command.status === "executing"
                      ? "Running"
                      : command.status === "completed"
                        ? "Completed"
                        : "Failed"}
                </span>
                {onDismiss && (command.status === "completed" || command.status === "failed") && (
                  <button
                    onClick={() => onDismiss(command.id)}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    aria-label="Dismiss"
                  >
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

