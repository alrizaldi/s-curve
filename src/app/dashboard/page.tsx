"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, Target, TrendingUp, Clock, BarChart3, Calendar } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { Project } from '@/types';

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const { projects, loading: projectsLoading } = useProjects();

  console.log('DashboardPage: Component rendered, loading:', loading, 'session:', session ? 'exists' : 'none');

  useEffect(() => {
    if (!supabase) {
      console.error('DashboardPage: Supabase client not available');
      setLoading(false);
      setInitialized(true);
      return;
    }
    
    console.log('DashboardPage: useEffect hook running to check session');
    
    const checkSession = async () => {
      console.log('DashboardPage: Checking session status...');
      const { data } = await supabase!.auth.getSession(); // Non-null assertion since we check above
      console.log("DashboardPage: Current session data:", data);
      setSession(data.session);

      if (!data.session) {
        console.log('DashboardPage: No active session, redirecting to login');
        // No active session, redirect to login
        router.push("/auth/login");
      } else {
        console.log('DashboardPage: Active session found, showing dashboard');
      }

      setLoading(false);
      setInitialized(true);
      console.log('DashboardPage: Loading set to false');
    };

    checkSession();

    // Listen for auth state changes
    console.log('DashboardPage: Setting up auth state change listener');
    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((_event, session) => {
      console.log('DashboardPage: Auth state changed, event:', _event, 'session exists:', !!session);
      setSession(session);
      if (!session) {
        console.log('DashboardPage: Session ended, redirecting to login');
        router.push("/auth/login");
      } else {
        console.log('DashboardPage: Session established, staying on dashboard');
      }
    });

    return () => {
      console.log('DashboardPage: Cleaning up auth state change listener');
      subscription.unsubscribe();
    };
  }, [router]);

  // Calculate project metrics from real data
  const projectMetrics = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'Active').length,
    completedProjects: projects.filter(p => p.status === 'Completed').length,
    delayedProjects: projects.filter(p => {
      const endDate = new Date(p.end_date);
      const currentDate = new Date();
      return p.status !== 'Completed' && endDate < currentDate;
    }).length,
  };

  // Get recent projects with progress (mocking progress for now since it's not in the base project model)
  const projectProgress = projects.slice(0, 3).map((project: Project, index) => ({
    id: project.id,
    name: project.name,
    progress: Math.floor(Math.random() * 100), // Placeholder - in real app this would come from WBS items
    status: project.status === 'Active' ? 'On Track' : 
            project.status === 'Completed' ? 'Completed' : 
            project.status === 'Cancelled' ? 'Cancelled' : 'On Track',
    deadline: new Date(project.end_date).toISOString().split('T')[0],
  }));

  // Get upcoming milestones from projects (mocking since we need to fetch them separately)
  const upcomingMilestones = projects
    .filter(p => p.status === 'Active')
    .slice(0, 3)
    .flatMap(project => [
      {
        id: `${project.id}-milestone`,
        name: `Completion of ${project.name}`,
        project: project.name,
        date: new Date(project.end_date).toISOString().split('T')[0],
        days: Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      }
    ]);

  console.log('DashboardPage: Dashboard rendering - loading:', loading, 'session exists:', !!session);

  // Show loading state while checking session
  if (loading || !initialized || projectsLoading) {
    console.log('DashboardPage: Showing loading state');
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="container mx-auto max-w-6xl py-8 px-6">
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-slate-500 font-medium">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render the dashboard if not authenticated
  // The redirect happens in useEffect
  if (!session) {
    console.log('DashboardPage: No session, returning null (redirect should have happened)');
    return null;
  }

  console.log('DashboardPage: Rendering dashboard content with metrics:', projectMetrics);

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white py-12 px-6 shadow-md">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center space-x-3 mb-3">
            <BarChart3 className="h-8 w-8 text-blue-200 animate-pulse" />
            <Badge variant="secondary" className="bg-blue-500/30 text-blue-100 hover:bg-blue-500/40 border-blue-400/20">
              Dashboard
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Project Dashboard
          </h1>
          <p className="text-blue-100 max-w-2xl text-sm md:text-base font-light">
            Welcome back! Here's what's happening with your projects today.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-8 px-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-slate-500">Total Projects</CardDescription>
                <div className="p-2 rounded-lg bg-blue-100">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-slate-800">
                {projectMetrics.totalProjects}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-slate-400 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                {projectMetrics.totalProjects > 0 ? '+0' : 'No projects yet'}
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-slate-500">Active Projects</CardDescription>
                <div className="p-2 rounded-lg bg-green-100">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-slate-800">
                {projectMetrics.activeProjects}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-slate-400">
                {projectMetrics.totalProjects > 0 
                  ? `${Math.round((projectMetrics.activeProjects / projectMetrics.totalProjects) * 100)}% of total` 
                  : 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-slate-500">Completed</CardDescription>
                <div className="p-2 rounded-lg bg-emerald-100">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-slate-800">
                {projectMetrics.completedProjects}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-slate-400">
                {projectMetrics.totalProjects > 0 
                  ? `${Math.round((projectMetrics.completedProjects / projectMetrics.totalProjects) * 100)}% success rate` 
                  : 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-slate-500">Delayed</CardDescription>
                <div className="p-2 rounded-lg bg-amber-100">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-slate-800">
                {projectMetrics.delayedProjects}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-slate-400">
                {projectMetrics.delayedProjects > 0 ? 'Requires attention' : 'All on track'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Progress and Upcoming Milestones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Activity className="h-5 w-5 text-indigo-600" />
                Project Progress
              </CardTitle>
              <CardDescription>
                Current status of your active projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectProgress.length > 0 ? (
                <div className="space-y-6">
                  {projectProgress.map((project) => (
                    <div key={project.id}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-slate-700">{project.name}</span>
                        <span className="text-sm text-slate-500">
                          {project.progress}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={project.progress} className="w-full h-2" />
                        <Badge
                          variant={
                            project.status === "On Track"
                              ? "default"
                              : project.status === "Completed"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Deadline: {project.deadline}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No active projects yet</p>
                  <a href="/projects/new" className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-2 block">
                    Create your first project <Activity className="h-4 w-4" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Clock className="h-5 w-5 text-emerald-600" />
                Upcoming Milestones
              </CardTitle>
              <CardDescription>Your next important deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingMilestones.length > 0 ? (
                <div className="space-y-6">
                  {upcomingMilestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100/50 hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-slate-700">{milestone.name}</div>
                        <div className="text-sm text-slate-500">
                          {milestone.project}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-slate-700">{milestone.date}</div>
                        <div className="text-sm text-slate-400 flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {milestone.days > 0 ? `${milestone.days} days left` : 'Due soon!'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No upcoming milestones</p>
                  <a href="/projects" className="text-emerald-600 hover:underline inline-flex items-center gap-1 mt-2 block">
                    Manage projects <Clock className="h-4 w-4" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* S-Curve Preview */}
        <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              S-Curve Overview
            </CardTitle>
            <CardDescription>
              Planned vs actual progress across all projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                <p className="text-slate-500 mb-3">
                  {projectMetrics.totalProjects > 0 
                    ? "S-Curve visualization would appear here." 
                    : "Create projects to see S-Curve visualization."}
                </p>
                {projectMetrics.totalProjects > 0 ? (
                  <a href="/scurve" className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium" onClick={() => console.log('DashboardPage: Clicked S-Curve link')}>
                    View Full S-Curve <TrendingUp className="h-4 w-4" />
                  </a>
                ) : (
                  <a href="/projects/new" className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium">
                    Create Project <Activity className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}