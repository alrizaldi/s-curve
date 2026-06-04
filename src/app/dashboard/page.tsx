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
import {
  Activity,
  Target,
  TrendingUp,
  Clock,
  BarChart3,
  Calendar,
  Loader2,
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { Project, WBSItem, ProgressLog, SChartDataPoint } from "@/types";
import { getWBSItems, getProgressLogs } from "@/actions/wbs";
import { getProjects as getAllProjects } from "@/actions/projects";
import {
  calculatePlannedCurve,
  calculateActualCurve,
  combineCurves,
} from "@/services/scurve";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const { projects, loading: projectsLoading } = useProjects();
  const [wbsItems, setWbsItems] = useState<WBSItem[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [scurveData, setScurveData] = useState<SChartDataPoint[]>([]);
  const [scurveLoading, setScurveLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      console.error("DashboardPage: Supabase client not available");
      setLoading(false);
      setInitialized(true);
      return;
    }

    const checkSession = async () => {
      const { data } = await supabase!.auth.getSession(); // Non-null assertion since we check above
      setSession(data.session);

      if (!data.session) {
        // No active session, redirect to login
        router.push("/auth/login");
      } else {
        console.log("DashboardPage: Active session found, showing dashboard");
      }

      setLoading(false);
      setInitialized(true);
    };

    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        router.push("/auth/login");
      } else {
        console.log("DashboardPage: Session established, staying on dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Fetch S-Curve data when projects are loaded
  useEffect(() => {
    const fetchSCurveData = async () => {
      if (projects.length > 0) {
        try {
          setScurveLoading(true);
          let allWbsItems: WBSItem[] = [];
          let allProgressLogs: ProgressLog[] = [];

          // Fetch WBS items and progress logs for all projects
          for (const project of projects) {
            const projectWbsItems = await getWBSItems(project.id);
            allWbsItems = [...allWbsItems, ...projectWbsItems];

            const projectProgressLogs = await getProgressLogs(project.id);
            allProgressLogs = [...allProgressLogs, ...projectProgressLogs];
          }

          setWbsItems(allWbsItems);
          setProgressLogs(allProgressLogs);

          // Calculate the S-Curve data
          const plannedData = calculatePlannedCurve(allWbsItems);
          const actualData = calculateActualCurve(allProgressLogs, allWbsItems);
          const combinedData = combineCurves(plannedData, actualData);

          setScurveData(combinedData);
        } catch (error) {
          console.error("Error fetching S-Curve data:", error);
          setScurveData([]);
        } finally {
          setScurveLoading(false);
        }
      } else {
        setScurveData([]);
        setScurveLoading(false);
      }
    };

    fetchSCurveData();
  }, [projects]);

  // Calculate project metrics from real data
  const projectMetrics = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === "Active").length,
    completedProjects: projects.filter((p) => p.status === "Completed").length,
    delayedProjects: projects.filter((p) => {
      const endDate = new Date(p.end_date);
      const currentDate = new Date();
      return p.status !== "Completed" && endDate < currentDate;
    }).length,
  };

  // Get recent projects with progress (mocking progress for now since it's not in the base project model)
  const projectProgress = projects
    .slice(0, 3)
    .map((project: Project, index) => ({
      id: project.id,
      name: project.name,
      progress: Math.floor(Math.random() * 100), // Placeholder - in real app this would come from WBS items
      status:
        project.status === "Active"
          ? "On Track"
          : project.status === "Completed"
            ? "Completed"
            : project.status === "Cancelled"
              ? "Cancelled"
              : "On Track",
      deadline: new Date(project.end_date).toISOString().split("T")[0],
    }));

  // Get upcoming milestones from projects (mocking since we need to fetch them separately)
  const upcomingMilestones = projects
    .filter((p) => p.status === "Active")
    .slice(0, 3)
    .flatMap((project) => [
      {
        id: `${project.id}-milestone`,
        name: `Completion of ${project.name}`,
        project: project.name,
        date: new Date(project.end_date).toISOString().split("T")[0],
        days: Math.ceil(
          (new Date(project.end_date).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      },
    ]);

  // Show loading state while checking session
  if (loading || !initialized || projectsLoading) {
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
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white py-12 px-6 shadow-md">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center space-x-3 mb-3">
            <BarChart3 className="h-8 w-8 text-blue-200 animate-pulse" />
            <Badge
              variant="secondary"
              className="bg-blue-500/30 text-blue-100 hover:bg-blue-500/40 border-blue-400/20"
            >
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
                <CardDescription className="text-slate-500">
                  Total Projects
                </CardDescription>
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
                {projectMetrics.totalProjects > 0 ? "+0" : "No projects yet"}
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-slate-500">
                  Active Projects
                </CardDescription>
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
                  : "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-slate-500">
                  Completed
                </CardDescription>
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
                  : "N/A"}
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-slate-500">
                  Delayed
                </CardDescription>
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
                {projectMetrics.delayedProjects > 0
                  ? "Requires attention"
                  : "All on track"}
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
                        <span className="font-medium text-slate-700">
                          {project.name}
                        </span>
                        <span className="text-sm text-slate-500">
                          {project.progress}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={project.progress}
                          className="w-full h-2"
                        />
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
                  <a
                    href="/projects/new"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1 mt-2 block"
                  >
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
                      className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border-slate-100/50 hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-slate-700">
                          {milestone.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {milestone.project}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-slate-700">
                          {milestone.date}
                        </div>
                        <div className="text-sm text-slate-400 flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {milestone.days > 0
                            ? `${milestone.days} days left`
                            : "Due soon!"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>No upcoming milestones</p>
                  <a
                    href="/projects"
                    className="text-emerald-600 hover:underline inline-flex items-center gap-1 mt-2 block"
                  >
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
            {scurveLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-600">Loading S-Curve data...</p>
                </div>
              </div>
            ) : scurveData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={scurveData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString()
                      }
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Progress"]}
                      labelFormatter={(value) =>
                        `Date: ${new Date(value).toLocaleDateString()}`
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="planned"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Planned Progress"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Actual Progress"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-slate-500 mb-3">
                    {projectMetrics.totalProjects > 0
                      ? "No progress data available yet."
                      : "Create projects to see S-Curve visualization."}
                  </p>
                  {projectMetrics.totalProjects > 0 ? (
                    <a
                      href="/scurve"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                      onClick={() =>
                        console.log("DashboardPage: Clicked S-Curve link")
                      }
                    >
                      View Full S-Curve <TrendingUp className="h-4 w-4" />
                    </a>
                  ) : (
                    <a
                      href="/projects/new"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                    >
                      Create Project <Activity className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
