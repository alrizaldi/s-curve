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

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

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

  console.log('DashboardPage: Dashboard rendering - loading:', loading, 'session exists:', !!session);

  // Show loading state while checking session
  if (loading || !initialized) {
    console.log('DashboardPage: Showing loading state');
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
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

  // Mock data for the dashboard
  const projectMetrics = {
    totalProjects: 12,
    activeProjects: 8,
    completedProjects: 3,
    delayedProjects: 1,
  };

  const projectProgress = [
    {
      id: 1,
      name: "Website Redesign",
      progress: 75,
      status: "On Track",
      deadline: "2024-02-15",
    },
    {
      id: 2,
      name: "Mobile App",
      progress: 45,
      status: "Slight Delay",
      deadline: "2024-03-20",
    },
    {
      id: 3,
      name: "Marketing Campaign",
      progress: 90,
      status: "On Track",
      deadline: "2024-01-30",
    },
  ];

  const upcomingMilestones = [
    {
      id: 1,
      name: "Beta Launch",
      project: "Mobile App",
      date: "2024-02-01",
      days: 12,
    },
    {
      id: 2,
      name: "Final Review",
      project: "Website Redesign",
      date: "2024-02-10",
      days: 21,
    },
    {
      id: 3,
      name: "Campaign Launch",
      project: "Marketing Campaign",
      date: "2024-01-25",
      days: 6,
    },
  ];

  console.log('DashboardPage: Rendering dashboard content with metrics:', projectMetrics);

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's what's happening with your projects today.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Projects</CardDescription>
            <CardTitle className="text-2xl">
              {projectMetrics.totalProjects}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +2 from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Projects</CardDescription>
            <CardTitle className="text-2xl">
              {projectMetrics.activeProjects}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {Math.round(
                (projectMetrics.activeProjects / projectMetrics.totalProjects) *
                  100,
              )}
              % of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl">
              {projectMetrics.completedProjects}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {Math.round(
                (projectMetrics.completedProjects /
                  projectMetrics.totalProjects) *
                  100,
              )}
              % success rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Delayed</CardDescription>
            <CardTitle className="text-2xl">
              {projectMetrics.delayedProjects}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Requires attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>
              Current status of your active projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {projectProgress.map((project) => (
                <div key={project.id}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{project.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={project.progress} className="w-full" />
                    <Badge
                      variant={
                        project.status === "On Track"
                          ? "default"
                          : project.status === "Slight Delay"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Deadline: {project.deadline}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Milestones</CardTitle>
            <CardDescription>Your next important deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {upcomingMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">{milestone.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {milestone.project}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{milestone.date}</div>
                    <div className="text-sm text-muted-foreground">
                      {milestone.days} days left
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* S-Curve Preview */}
      <Card>
        <CardHeader>
          <CardTitle>S-Curve Overview</CardTitle>
          <CardDescription>
            Planned vs actual progress across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center border rounded-lg">
            <p className="text-muted-foreground">
              S-Curve visualization would appear here. <br />
              <a href="/scurve" className="text-blue-600 hover:underline" onClick={() => console.log('DashboardPage: Clicked S-Curve link')}>
                View Full S-Curve
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}