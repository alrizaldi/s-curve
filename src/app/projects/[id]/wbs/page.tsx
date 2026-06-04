"use client";

import { useState, useEffect, use } from "react";
import {
  getWBSItems,
  createWBSItem,
  updateWBSItem,
  deleteWBSItem,
} from "@/actions/wbs";
import { getProjects } from "@/actions/projects";
import { WBSItem, WBSItemFormValues, WBSItemStatus, Project } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Edit3,
  ArrowLeft,
  Loader2,
  Sliders,
  Check,
  MessageSquare,
  Network,
} from "lucide-react";
import Link from "next/link";

type PageParams = {
  id: string;
};

export default function ProjectWBSPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(null);
  const [wbsItems, setWbsItems] = useState<WBSItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Collapse/Expand state for WBS items
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>(
    {},
  );

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WBSItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: "",
    weight: "1.0",
    planned_start: "",
    planned_end: "",
    status: "Not Started" as WBSItemStatus,
  });

  // Progress update state
  const [progressUpdateItem, setProgressUpdateItem] = useState<WBSItem | null>(
    null,
  );
  const [progressValue, setProgressValue] = useState(0);
  const [progressRemarks, setProgressRemarks] = useState("");
  const [submittingProgress, setSubmittingProgress] = useState(false);

  // Load project details and WBS items
  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsList, wbsList] = await Promise.all([
        getProjects(),
        getWBSItems(projectId),
      ]);

      const foundProject = projectsList.find((p) => p.id === projectId);

      if (foundProject) setProject(foundProject);
      setWbsItems(wbsList);
    } catch (error) {
      console.error("[WBSPage][LoadData] Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  // Check if an item is a parent node (has children)
  const isParent = (itemId: string) => {
    const hasChildren = wbsItems.some(
      (item) =>
        item.parent_id === itemId ||
        (itemId === "root" &&
          (item.parent_id === null || item.parent_id === undefined)),
    );
    return hasChildren;
  };

  // Get children of a WBS item
  const getChildren = (itemId: string | undefined | null) => {
    // For root level (no parent), find items where parent_id is null
    // For child level, find items where parent_id matches the given ID
    const children = wbsItems.filter((item) => {
      if (itemId === undefined || itemId === null) {
        // Looking for root-level items (those with no parent)
        return item.parent_id === null || item.parent_id === undefined;
      } else {
        // Looking for children of a specific parent
        return item.parent_id === itemId;
      }
    });
    return children;
  };

  // Toggle Collapse/Expand
  const toggleCollapse = (itemId: string) => {
    setCollapsedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Handle Form Input Change
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      parent_id: "",
      weight: "1.0",
      planned_start: "",
      planned_end: "",
      status: "Not Started",
    });
    setEditingItem(null);
  };

  // Open Modal for Create/Edit
  const openFormModal = (item?: WBSItem, parentId?: string) => {
    if (item) {
      setEditingItem(item);
      const startStr = item.planned_start.toISOString().split("T")[0];
      const endStr = item.planned_end.toISOString().split("T")[0];
      setFormData({
        name: item.name,
        description: item.description || "",
        parent_id: item.parent_id || "",
        weight: String(item.weight),
        planned_start: startStr,
        planned_end: endStr,
        status: item.status,
      });
    } else {
      resetForm();
      if (parentId) {
        setFormData((prev) => ({ ...prev, parent_id: parentId }));
      }
    }
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.planned_start || !formData.planned_end) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const itemValues: WBSItemFormValues = {
        name: formData.name,
        description: formData.description || undefined,
        parent_id: formData.parent_id || undefined,
        weight: parseFloat(formData.weight) || 1.0,
        planned_start: new Date(formData.planned_start),
        planned_end: new Date(formData.planned_end),
        status: formData.status,
        progress: editingItem ? editingItem.progress : 0,
        sort_order: editingItem ? editingItem.sort_order : wbsItems.length,
      };

      if (editingItem) {
        await updateWBSItem(projectId, editingItem.id, itemValues);
      } else {
        await createWBSItem(projectId, itemValues);
      }
      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      alert(error.message || "Operation failed.");
    }
  };

  // Handle Delete
  const handleDeleteItem = async (itemId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this WBS item? Deleting a parent item will delete all of its sub-tasks recursively.",
      )
    ) {
      try {
        await deleteWBSItem(projectId, itemId);
        await loadData();
      } catch (error: any) {
        alert(error.message || "Failed to delete item.");
      }
    }
  };

  // Handle Progress Modal Open
  const openProgressModal = (item: WBSItem) => {
    setProgressUpdateItem(item);
    setProgressValue(item.progress);
    setProgressRemarks("");
  };

  // Handle Progress Submit
  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressUpdateItem) return;

    try {
      setSubmittingProgress(true);
      await updateWBSItem(
        projectId,
        progressUpdateItem.id,
        {
          progress: progressValue,
          status: progressValue === 100 ? "Completed" : "In Progress",
        },
        progressRemarks,
      );
      setProgressUpdateItem(null);
      await loadData();
    } catch (error: any) {
      alert(error.message || "Failed to update progress.");
    } finally {
      setSubmittingProgress(false);
    }
  };

  // Recursive Tree Renderer
  const renderTreeNodes = (parentId: string | undefined | null, depth = 0) => {
    const nodes = getChildren(parentId);
    if (nodes.length === 0) return null;

    return (
      <div
        className={`space-y-3 ${depth > 0 ? "pl-6 border-l border-slate-200 mt-2 ml-3" : ""}`}
      >
        {nodes.map((node) => {
          const hasChildren = isParent(node.id);
          const isCollapsed = collapsedItems[node.id];
          const isLeaf = !hasChildren;

          return (
            <div key={node.id} className="relative group/item">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 gap-4">
                {/* Node Label & Expand Icon */}
                <div className="flex items-start space-x-3 flex-1 min-w-[200px]">
                  {hasChildren ? (
                    <button
                      onClick={() => toggleCollapse(node.id)}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500 mt-0.5 transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <div className="w-6 flex justify-center items-center mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800 text-sm md:text-base">
                        {node.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-1.5 font-normal text-slate-400 border-slate-200"
                      >
                        Weight: {node.weight}
                      </Badge>
                      {isLeaf ? (
                        <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200 font-medium text-[10px] py-0 px-1.5">
                          Leaf Task
                        </Badge>
                      ) : (
                        <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 font-medium text-[10px] py-0 px-1.5">
                          Summary Phase
                        </Badge>
                      )}
                    </div>
                    {node.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {node.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 mt-1.5 font-mono">
                      <span>
                        Start: {node.planned_start.toLocaleDateString()}
                      </span>
                      <span>End: {node.planned_end.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Indicators & Controls */}
                <div className="flex items-center justify-between md:justify-end gap-6 flex-wrap md:flex-nowrap">
                  <div className="w-32 md:w-40 space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-600">
                      <span>Progress</span>
                      <span>{node.progress}%</span>
                    </div>
                    <Progress
                      value={node.progress}
                      className="h-1.5 bg-slate-100"
                    />
                  </div>

                  <Badge
                    variant={
                      node.status === "Completed"
                        ? "secondary"
                        : node.status === "In Progress"
                          ? "default"
                          : node.status === "Delayed"
                            ? "destructive"
                            : "outline"
                    }
                    className="text-xs shrink-0"
                  >
                    {node.status}
                  </Badge>

                  {/* Actions for Node */}
                  <div className="flex items-center gap-1">
                    {isLeaf && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Update Progress"
                        onClick={() => openProgressModal(node)}
                        className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        <Sliders className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Add Sub-item"
                      onClick={() => openFormModal(undefined, node.id)}
                      className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Edit Item"
                      onClick={() => openFormModal(node)}
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Delete Item"
                      onClick={() => handleDeleteItem(node.id)}
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Render Children Recursively */}
              {hasChildren &&
                !isCollapsed &&
                renderTreeNodes(node.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm text-slate-500">
          Loading Work Breakdown Structure...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-6">
      <div className="container mx-auto max-w-5xl">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center space-x-2 mb-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:text-slate-800"
          >
            <Link
              href={`/projects/${projectId}`}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Project
            </Link>
          </Button>
        </div>

        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Network className="h-6 w-6 text-indigo-600" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">
                Work Breakdown Structure (WBS)
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Project:{" "}
              <span className="font-semibold text-slate-700">
                {project?.name}
              </span>
            </p>
          </div>
          <Button
            onClick={() => openFormModal()}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Root WBS Item
          </Button>
        </div>

        {/* Tree Container */}
        {wbsItems.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-2 border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-slate-600 text-lg font-medium">
                Empty Work Breakdown Structure
              </CardTitle>
              <CardDescription className="text-slate-400 max-w-sm mx-auto">
                No phases or tasks have been defined yet. Get started by adding
                a root-level phase (e.g. "Phase 1: Design").
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => openFormModal()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Create First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">{renderTreeNodes(undefined)}</div>
        )}
      </div>

      {/* CREATE/EDIT OVERLAY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-slate-55 pb-4 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-800">
                {editingItem ? "Edit WBS Item" : "Add WBS Item"}
              </CardTitle>
              <CardDescription>
                {formData.parent_id
                  ? `Adding a sub-task under parent phase.`
                  : "Define a root-level task or project phase."}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleFormSubmit}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Design Wireframes, Development Phase"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide a detailed description of the task deliverables..."
                    className="w-full min-h-[80px] text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="weight">Task Weight *</Label>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.weight}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="status">Initial Status</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="planned_start">Planned Start *</Label>
                    <Input
                      id="planned_start"
                      name="planned_start"
                      type="date"
                      value={formData.planned_start}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="planned_end">Planned End *</Label>
                    <Input
                      id="planned_end"
                      name="planned_end"
                      type="date"
                      value={formData.planned_end}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="parent_id">Parent WBS Item</Label>
                  <select
                    id="parent_id"
                    name="parent_id"
                    value={formData.parent_id}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="">None (Root Level)</option>
                    {wbsItems
                      .filter(
                        (item) => !editingItem || item.id !== editingItem.id,
                      ) // Avoid cyclic referencing
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Depth:{" "}
                          {wbsItems.filter((i) => i.parent_id === item.id)
                            .length
                            ? "Parent"
                            : "Leaf"}
                          )
                        </option>
                      ))}
                  </select>
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {editingItem ? "Save Changes" : "Create Item"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* UPDATE PROGRESS OVERLAY MODAL */}
      {progressUpdateItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-xl animate-in zoom-in-95 duration-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-indigo-600" />
                Update Task Progress
              </CardTitle>
              <CardDescription>
                Update the actual progress for task:{" "}
                <span className="font-semibold text-slate-700">
                  {progressUpdateItem.name}
                </span>
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleProgressSubmit}>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <Label>Progress Percentage</Label>
                    <span className="text-indigo-600">{progressValue}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressValue}
                    onChange={(e) => setProgressValue(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0% (Not Started)</span>
                    <span>50%</span>
                    <span>100% (Completed)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="remarks" className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" /> Progress Log
                    Remarks
                  </Label>
                  <Input
                    id="remarks"
                    value={progressRemarks}
                    onChange={(e) => setProgressRemarks(e.target.value)}
                    placeholder="e.g. Completed initial layout, delayed due to API blocks..."
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProgressUpdateItem(null)}
                  disabled={submittingProgress}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1"
                  disabled={submittingProgress}
                >
                  {submittingProgress ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Save Progress
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
