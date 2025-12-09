"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Tag } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, Pencil, Trash2, Tag as TagIcon } from "lucide-react";

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#10B981",
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const data = await api.tags.getAll();
      setTags(data);
    } catch (error) {
      console.error("Failed to load tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.tags.create(formData);
      await loadTags();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create tag:", error);
      alert("Failed to create tag: " + (error as Error).message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;
    try {
      await api.tags.update(editingTag.id, formData);
      await loadTags();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Failed to update tag:", error);
      alert("Failed to update tag: " + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    try {
      await api.tags.delete(id);
      await loadTags();
    } catch (error) {
      console.error("Failed to delete tag:", error);
      alert("Failed to delete tag: " + (error as Error).message);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingTag(null);
    setShowModal(true);
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color || "#10B981",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: "", color: "#10B981" });
    setEditingTag(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">Loading tags...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Tags</h1>
          <p className="text-slate-400 mt-1">
            Label devices with flexible tags
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Tag
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {tags.map((tag) => (
          <Card
            key={tag.id}
            className="bg-slate-800 border-slate-700 p-4 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: tag.color + "20",
                  color: tag.color || "#10B981",
                }}
              >
                {tag.name}
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              {tag.deviceCount} device{tag.deviceCount !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(tag)}
                className="flex-1 p-2 hover:bg-slate-700 rounded-lg transition-colors text-sm text-slate-400"
              >
                <Pencil className="w-3 h-3 mx-auto" />
              </button>
              <button
                onClick={() => handleDelete(tag.id)}
                className="flex-1 p-2 hover:bg-slate-700 rounded-lg transition-colors text-sm text-red-400"
              >
                <Trash2 className="w-3 h-3 mx-auto" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {tags.length === 0 && (
        <Card className="bg-slate-800 border-slate-700 p-12 text-center">
          <TagIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No tags yet
          </h3>
          <p className="text-slate-400 mb-4">
            Create your first tag to label devices
          </p>
          <Button onClick={openCreateModal}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Tag
          </Button>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingTag ? "Edit Tag" : "Create Tag"}
            </h2>
            <form onSubmit={editingTag ? handleUpdate : handleCreate}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="color" className="text-white">
                    Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="bg-slate-900 border-slate-700 text-white flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTag ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
