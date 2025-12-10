import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { Tag, Plus, Monitor, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getTags } from "@/lib/api";

const colorOptions = [
  "#EF4444", // red
  "#22D3EE", // cyan
  "#F59E0B", // amber
  "#A855F7", // purple
  "#10B981", // emerald
  "#6366F1", // indigo
  "#EC4899", // pink
  "#F97316", // orange
];

export default function Tags() {
  const { data: tags = [], isLoading, error } = useQuery({
    queryKey: ["tags"],
    queryFn: () => getTags(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <MainLayout title="Tags" subtitle="Loading tags...">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tags...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Tags" subtitle="Error loading tags">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Failed to load tags</p>
            <p className="text-muted-foreground text-sm">{(error as Error).message}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Tags" subtitle="Label devices with flexible tags for quick filtering">
      <div className="space-y-6">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-end"
        >
          <Button className="btn-glow gap-2">
            <Plus className="w-4 h-4" />
            Create Tag
          </Button>
        </motion.div>

        {/* Tags Grid */}
        {tags.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl flex flex-col items-center justify-center py-16"
          >
            <Tag className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No tags yet</p>
            <p className="text-muted-foreground mb-4">Create tags to organize and filter devices</p>
            <Button className="btn-glow gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Tag
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tags.map((tag, index) => {
              const color = colorOptions[index % colorOptions.length];
              return (
                <motion.div
                  key={tag.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="glass rounded-2xl p-5 group cursor-pointer hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Tag className="w-5 h-5" style={{ color }} />
                    </div>
                    <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">{tag.name}</h3>
                  {tag.description && (
                    <p className="text-sm text-muted-foreground mb-3">{tag.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t border-border/30">
                    <Monitor className="w-4 h-4" />
                    <span>{tag._count?.devices || 0} devices</span>
                  </div>
                </motion.div>
              );
            })}

            {/* Create New Tag Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + tags.length * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="glass-dashed rounded-2xl flex flex-col items-center justify-center p-12 cursor-pointer group hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Create New Tag</h3>
              <p className="text-xs text-muted-foreground text-center">
                Add a new tag
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
