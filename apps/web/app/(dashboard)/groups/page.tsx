"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Group } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, Pencil, Trash2, Users } from "lucide-react";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await api.groups.getAll();
      setGroups(data);
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.groups.create(formData);
      await loadGroups();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("Failed to create group: " + (error as Error).message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    try {
      await api.groups.update(editingGroup.id, formData);
      await loadGroups();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Failed to update group:", error);
      alert("Failed to update group: " + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    try {
      await api.groups.delete(id);
      await loadGroups();
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert("Failed to delete group: " + (error as Error).message);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingGroup(null);
    setShowModal(true);
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      color: group.color || "#3B82F6",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", color: "#3B82F6" });
    setEditingGroup(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Groups</h1>
          <p className="text-slate-400 mt-1">
            Organize devices into logical groups
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card
            key={group.id}
            className="bg-slate-800 border-slate-700 p-6 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: group.color + "20" }}
                >
                  <Users
                    className="w-6 h-6"
                    style={{ color: group.color || "#3B82F6" }}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {group.name}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {group.deviceCount} device{group.deviceCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(group)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => handleDelete(group.id)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
            {group.description && (
              <p className="text-sm text-slate-400">{group.description}</p>
            )}
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <Card className="bg-slate-800 border-slate-700 p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No groups yet
          </h3>
          <p className="text-slate-400 mb-4">
            Create your first group to organize devices
          </p>
          <Button onClick={openCreateModal}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingGroup ? "Edit Group" : "Create Group"}
            </h2>
            <form onSubmit={editingGroup ? handleUpdate : handleCreate}>
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
                  <Label htmlFor="description" className="text-white">
                    Description (optional)
                  </Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
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
                  {editingGroup ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
