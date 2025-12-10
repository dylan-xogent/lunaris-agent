import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { Users, Plus, Monitor, MoreVertical, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getGroups } from "@/lib/api";

const colorOptions = [
  "from-primary to-cyan-400",
  "from-destructive to-rose-400",
  "from-accent to-purple-400",
  "from-warning to-orange-400",
  "from-success to-emerald-400",
  "from-cyan-500 to-blue-500",
];

export default function Groups() {
  const { data: groups = [], isLoading, error, refetch } = useQuery({
    queryKey: ["groups"],
    queryFn: () => getGroups(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <MainLayout title="Groups" subtitle="Loading groups...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading groups...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Groups" subtitle="Error loading groups">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Failed to load groups</p>
            <p className="text-muted-foreground text-sm">{(error as Error).message}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Groups" subtitle="Organize devices into logical groups for easier management">
      <div className="space-y-6">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-end"
        >
          <Button className="btn-glow gap-2">
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        </motion.div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl flex flex-col items-center justify-center py-16"
          >
            <Users className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No groups yet</p>
            <p className="text-muted-foreground mb-4">Create groups to organize your devices</p>
            <Button className="btn-glow gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Group
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, index) => {
              const color = colorOptions[index % colorOptions.length];
              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="glass rounded-2xl overflow-hidden group cursor-pointer"
                >
                  <div className={`h-2 bg-gradient-to-r ${color}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                        <Users className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 btn-ghost transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{group.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{group.description || "No description"}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-border/30">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Monitor className="w-4 h-4" />
                        <span>{group._count?.devices || 0} devices</span>
                      </div>
                      <button className="text-sm text-primary font-medium hover:underline">
                        Manage
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Create New Group Card */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 + groups.length * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-dashed rounded-2xl flex flex-col items-center justify-center p-12 cursor-pointer group hover:border-primary/50 transition-colors"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Create New Group</h3>
              <p className="text-sm text-muted-foreground text-center">
                Add a new group to organize your devices
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
