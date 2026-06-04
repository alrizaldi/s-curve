'use client';

import { useState, useEffect, use } from 'react';
import { getMilestones, createMilestone, updateMilestone, deleteMilestone } from '@/actions/milestones';
import { getProjects } from '@/actions/projects';
import { Milestone, MilestoneFormValues, MilestoneStatus, Project } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Flag, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock 
} from 'lucide-react';
import Link from 'next/link';
import { ExportButton } from '@/components/ui/export-button';

type PageParams = {
  id: string;
};

export default function ProjectMilestonesPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    due_date: '',
    completed_date: '',
    status: 'Pending' as MilestoneStatus,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsList, milestonesList] = await Promise.all([
        getProjects(),
        getMilestones(projectId)
      ]);
      const foundProject = projectsList.find(p => p.id === projectId);
      if (foundProject) setProject(foundProject);
      setMilestones(milestonesList);
    } catch (error) {
      console.error('Failed to load milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      due_date: '',
      completed_date: '',
      status: 'Pending',
    });
    setEditingMilestone(null);
  };

  const openFormModal = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      const dueStr = milestone.due_date.toISOString().split('T')[0];
      const completedStr = milestone.completed_date 
        ? milestone.completed_date.toISOString().split('T')[0] 
        : '';
      setFormData({
        name: milestone.name,
        description: milestone.description || '',
        due_date: dueStr,
        completed_date: completedStr,
        status: milestone.status,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.due_date) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const milestoneValues: MilestoneFormValues = {
        name: formData.name,
        description: formData.description || undefined,
        due_date: new Date(formData.due_date),
        completed_date: formData.completed_date ? new Date(formData.completed_date) : undefined,
        status: formData.status,
      };

      // Automatically set completed date if status is marked Completed and no date is set
      if (formData.status === 'Completed' && !formData.completed_date) {
        milestoneValues.completed_date = new Date();
      }

      if (editingMilestone) {
        await updateMilestone(projectId, editingMilestone.id, milestoneValues);
      } else {
        await createMilestone(projectId, milestoneValues);
      }

      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Operation failed.');
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      try {
        await deleteMilestone(projectId, id);
        await loadData();
      } catch (error: any) {
        alert(error.message || 'Failed to delete milestone.');
      }
    }
  };

  // Stats calculation
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const pendingMilestones = milestones.filter(m => m.status === 'Pending').length;
  const delayedMilestones = milestones.filter(m => m.status === 'Delayed').length;

  if (loading && !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-4" />
        <p className="text-sm text-slate-500">Loading Milestones...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Navigation */}
        <div className="flex items-center space-x-2 mb-6">
          <Button asChild variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800">
            <Link href={`/projects/${projectId}`} className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Project
            </Link>
          </Button>
        </div>

        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flag className="h-6 w-6 text-emerald-600" />
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">
                Project Milestones
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Project: <span className="font-semibold text-slate-700">{project?.name}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              project={project!}
              milestones={milestones}
              variant="outline"
              className="shrink-0"
            />
            <Button onClick={() => openFormModal()} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Add Milestone
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-slate-100">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center">
              <span className="text-xs text-slate-400 font-medium">Total</span>
              <span className="text-2xl font-bold text-slate-800 mt-1">{totalMilestones}</span>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-100">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Completed
              </span>
              <span className="text-2xl font-bold text-emerald-600 mt-1">{completedMilestones}</span>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-100">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Clock className="h-3 w-3 text-sky-500" /> Pending
              </span>
              <span className="text-2xl font-bold text-sky-600 mt-1">{pendingMilestones}</span>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-100">
            <CardContent className="p-4 flex flex-col justify-center items-center text-center">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-500" /> Delayed
              </span>
              <span className="text-2xl font-bold text-red-600 mt-1">{delayedMilestones}</span>
            </CardContent>
          </Card>
        </div>

        {/* Milestones Content */}
        {milestones.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-2 border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-slate-600 text-lg font-medium">No Milestones Defined</CardTitle>
              <CardDescription className="text-slate-400 max-w-sm mx-auto">
                No milestones have been configured for this project yet. Define key checkpoints like "Beta Release" or "Civil Handover".
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => openFormModal()} className="bg-emerald-600 hover:bg-emerald-700">
                Create First Milestone
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Timeline view */
          <div className="relative border-l border-slate-200 ml-4 pl-8 space-y-6">
            {milestones.map((m) => {
              const isOverdue = m.status === 'Pending' && new Date(m.due_date).getTime() < Date.now();
              const displayStatus = isOverdue ? 'Delayed' : m.status;

              return (
                <div key={m.id} className="relative group">
                  {/* Timeline point indicator */}
                  <div className={`absolute -left-[41px] top-1.5 w-6 h-6 rounded-full border-4 bg-white flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shadow-sm ${
                    displayStatus === 'Completed' ? 'border-emerald-500 text-emerald-500' :
                    displayStatus === 'Delayed' ? 'border-red-500 text-red-500' : 'border-sky-500 text-sky-500'
                  }`}>
                    {displayStatus === 'Completed' ? (
                      <CheckCircle2 className="h-3 w-3 fill-emerald-50 text-emerald-600" />
                    ) : displayStatus === 'Delayed' ? (
                      <AlertTriangle className="h-2.5 w-2.5 fill-red-50 text-red-600" />
                    ) : (
                      <Clock className="h-2.5 w-2.5 fill-sky-50 text-sky-600" />
                    )}
                  </div>

                  <Card className="bg-white hover:shadow-md border-slate-100 transition-all duration-200">
                    <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base font-bold text-slate-800">{m.name}</CardTitle>
                          <Badge 
                            variant={
                              displayStatus === 'Completed' ? 'secondary' :
                              displayStatus === 'Delayed' ? 'destructive' : 'outline'
                            }
                            className="text-[10px] py-0 px-1.5 font-semibold"
                          >
                            {displayStatus}
                          </Badge>
                        </div>
                        {m.description && (
                          <CardDescription className="text-slate-500 text-xs mt-1">
                            {m.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          title="Edit Milestone"
                          onClick={() => openFormModal(m)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          title="Delete Milestone"
                          onClick={() => handleDeleteMilestone(m.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center gap-4 pt-0 border-t border-slate-50 mt-2">
                      <div className="flex items-center gap-1.5 mt-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Due Date: <strong className="text-slate-700">{m.due_date.toLocaleDateString()}</strong></span>
                      </div>
                      {m.completed_date && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Completed On: <strong className="text-emerald-700">{m.completed_date.toLocaleDateString()}</strong></span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD/EDIT MILESTONE OVERLAY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white shadow-xl animate-in zoom-in-95 duration-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Flag className="h-5 w-5 text-emerald-600" />
                {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
              </CardTitle>
              <CardDescription>
                Define key delivery points for progress tracking.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleFormSubmit}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-1">
                  <Label htmlFor="name">Milestone Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Design Approved, Beta Demo"
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
                    placeholder="e.g. Handover of documentation, client signoff on deliverables..."
                    className="w-full min-h-[80px] text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="due_date">Target Due Date *</Label>
                    <Input
                      id="due_date"
                      name="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </div>
                </div>

                {formData.status === 'Completed' && (
                  <div className="space-y-1">
                    <Label htmlFor="completed_date">Actual Completion Date</Label>
                    <Input
                      id="completed_date"
                      name="completed_date"
                      type="date"
                      value={formData.completed_date}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </CardContent>
              <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  {editingMilestone ? 'Save Changes' : 'Create Milestone'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
