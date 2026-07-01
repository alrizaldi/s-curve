"use client";

import { getProjectById } from "@/actions/projects";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Project, WBSItem, ProgressLog, Milestone } from "@/types";
import {
  calculatePlannedCurve,
  calculateActualCurve,
  combineCurves,
} from "@/services/scurve";
import { useState, useEffect, use, useRef } from "react";
import { getWBSItems, getProgressLogs } from "@/actions/wbs";
import { getMilestones } from "@/actions/milestones";
import {
  FolderKanban,
  Flag,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  TrendingUp,
  Target,
  Sliders,
} from "lucide-react";
import Link from "next/link";
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
import {
  ExportButton,
  SCurveExportButton,
  ProjectExportButton,
} from "@/components/ui/export-button";
import { deleteProject } from "@/actions/projects";

type PageParams = {
  id: string;
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = use(params);
  const { id: projectId } = resolvedParams;

  const [project, setProject] = useState<Project | null>(null);
  const [wbsItems, setWbsItems] = useState<WBSItem[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [scurveData, setScurveData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"wbs" | "milestones">("wbs");
  const [loading, setLoading] = useState(true);

  const scurveChartRef = useRef<HTMLDivElement>(null); // Ref for the S-Curve chart

  // Load project data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectData, wbsItemsData, progressLogsData, milestonesData] =
          await Promise.all([
            getProjectById(projectId),
            getWBSItems(projectId),
            getProgressLogs(projectId),
            getMilestones(projectId),
          ]);

        setProject(projectData);
        setWbsItems(wbsItemsData);
        setProgressLogs(progressLogsData);
        setMilestones(milestonesData);

        // Calculate S-Curve data
        const plannedData = calculatePlannedCurve(wbsItemsData);
        const actualData = calculateActualCurve(progressLogsData, wbsItemsData);
        const combinedData = combineCurves(plannedData, actualData);
        setScurveData(combinedData);
      } catch (error) {
        console.error("Error fetching project data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  if (loading && !project) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        {/* Premium Header Banner */}
        <div className="bg-gradient-to-r from-slate-600 via-gray-700 to-slate-800 text-white py-12 px-6 shadow-md">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center space-x-3 mb-3">
              <Activity className="h-8 w-8 text-slate-200" />
              <Badge
                variant="secondary"
                className="bg-slate-500/30 text-slate-100 hover:bg-slate-500/40 border-slate-400/20"
              >
                Project Details
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Loading Project...
            </h1>
            <p className="text-slate-100 max-w-2xl text-sm md:text-base font-light">
              Please wait while we load the project details
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        {/* Premium Header Banner */}
        <div className="bg-gradient-to-r from-slate-600 via-gray-700 to-slate-800 text-white py-12 px-6 shadow-md">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center space-x-3 mb-3">
              <Activity className="h-8 w-8 text-slate-200" />
              <Badge
                variant="secondary"
                className="bg-slate-500/30 text-slate-100 hover:bg-slate-500/40 border-slate-400/20"
              >
                Project Details
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Project Not Found
            </h1>
            <p className="text-slate-100 max-w-2xl text-sm md:text-base font-light">
              The requested project could not be found
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-5xl py-8 px-6">
          <div className="flex justify-center items-center py-20">
            <Card className="max-w-md text-center">
              <CardHeader>
                <CardTitle className="text-slate-800">
                  Project Not Found
                </CardTitle>
                <CardDescription className="text-slate-500">
                  The requested project could not be found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="bg-slate-600 hover:bg-slate-700">
                  <Link href="/projects">Back to Projects</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Calculate dynamic project overall progress
  let totalRootWeight = 0;
  let rootWeightedProgressSum = 0;
  wbsItems.forEach((item) => {
    totalRootWeight += item.weight;
    rootWeightedProgressSum += item.progress * item.weight;
  });
  const overallProgress =
    totalRootWeight > 0
      ? Math.round(rootWeightedProgressSum / totalRootWeight)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Project Banner Info */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-blue-800 text-white py-10 px-6 shadow-md">
        <div className="container mx-auto max-w-5xl">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-blue-100 mt-2 max-w-2xl">
                {project.description || "No description provided."}
              </p>
            </div>
            <Badge
              variant={
                project.status === "Active"
                  ? "secondary"
                  : project.status === "Completed"
                    ? "default"
                    : project.status === "Cancelled"
                      ? "destructive"
                      : "outline"
              }
              className="text-sm px-3 py-1 bg-white/20 backdrop-blur-sm border border-white/30"
            >
              {project.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <div className="flex items-center gap-2 text-blue-100">
                <Calendar className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">
                  Start Date
                </span>
              </div>
              <p className="text-lg font-semibold mt-1">
                {new Date(project.start_date).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <div className="flex items-center gap-2 text-blue-100">
                <Calendar className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">
                  End Date
                </span>
              </div>
              <p className="text-lg font-semibold mt-1">
                {new Date(project.end_date).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
              <div className="flex items-center gap-2 text-blue-100">
                <Target className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">
                  Overall Progress
                </span>
              </div>
              <p className="text-lg font-semibold mt-1 text-center">
                {overallProgress}%
              </p>
              <Progress value={overallProgress} className="mt-2 h-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl py-8 px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-slate-800 text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                Project Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400 font-medium">
                    Start Date
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    {new Date(project.start_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">
                    End Date
                  </span>
                  <p className="text-sm font-semibold text-slate-700">
                    {new Date(project.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-slate-800 text-base font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-600" />
                Overall WBS Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center">
              <div className="space-y-2">
                <Progress value={overallProgress} className="w-full h-2" />
                <p className="text-center text-lg font-bold text-indigo-600">
                  {overallProgress}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-slate-800 text-base font-semibold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-indigo-100 text-indigo-700 hover:bg-indigo-50 justify-start"
                >
                  <Link
                    href={`/projects/${project.id}/wbs`}
                    className="flex items-center gap-1.5"
                  >
                    <FolderKanban className="h-4 w-4" /> Manage WBS Structure
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-emerald-100 text-emerald-700 hover:bg-emerald-50 justify-start"
                >
                  <Link
                    href={`/projects/${project.id}/milestones`}
                    className="flex items-center gap-1.5"
                  >
                    <Flag className="h-4 w-4" /> Manage Milestones
                  </Link>
                </Button>
                {/* <ExportButton
                  project={project}
                  wbsItems={wbsItems}
                  milestones={milestones}
                  progressLogs={progressLogs}
                  variant="outline"
                  size="sm"
                  className="border-blue-100 text-blue-700 hover:bg-blue-50 justify-start mt-2"
                /> */}
                <SCurveExportButton
                  project={project}
                  wbsItems={wbsItems}
                  progressLogs={progressLogs}
                  chartRef={scurveChartRef} // Pass the chart ref
                  variant="outline"
                  size="sm"
                  className="border-purple-100 text-purple-700 hover:bg-purple-50 justify-start"
                />
                <ProjectExportButton
                  projectId={project.id}
                  projectName={project.name}
                  variant="outline" // Changed to match other buttons
                  size="sm" // Changed to match other buttons
                  className="border-blue-100 text-blue-700 hover:bg-blue-50 justify-start" // Updated to match other buttons style
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (
                      confirm(
                        "Are you sure you want to delete this project? This action cannot be undone and will also delete all associated WBS items, milestones, and progress logs.",
                      )
                    ) {
                      try {
                        await deleteProject(project.id);
                        window.location.href = "/projects"; // Redirect to projects list
                      } catch (error) {
                        console.error("Error deleting project:", error);
                        alert("An error occurred while deleting the project");
                      }
                    }
                  }}
                  className="border-red-100 text-red-700 hover:bg-red-50 justify-start mt-2"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" /> Delete Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* S-CURVE ANALYSIS SECTION */}
        <div className="mt-8">
          <Card className="bg-white border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-slate-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  S-Curve Analysis
                </div>
                <SCurveExportButton
                  project={project}
                  wbsItems={wbsItems}
                  progressLogs={progressLogs}
                  chartRef={scurveChartRef} // Pass the chart ref
                  variant="outline"
                  size="sm"
                />
              </CardTitle>
              <CardDescription>
                Planned vs actual progress for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scurveData.length > 0 ? (
                <div className="h-80" ref={scurveChartRef}>
                  {" "}
                  {/* Add ref to chart container */}
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
                      No progress data available yet.
                    </p>
                    <a
                      href={`/projects/${project.id}/wbs`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                    >
                      Add WBS Items <TrendingUp className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value: string) =>
            setActiveTab(value as "wbs" | "milestones")
          }
          className="flex flex-col space-y-4 mt-8"
        >
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 border border-slate-200 p-1 rounded-lg self-start">
            <TabsTrigger
              value="wbs"
              className="py-2 px-4 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-200 rounded-md text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center"
            >
              <FolderKanban className="h-4 w-4 mr-2" />
              Work Breakdown
            </TabsTrigger>
            <TabsTrigger
              value="milestones"
              className="py-2 px-4 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-200 rounded-md text-slate-600 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center"
            >
              <Flag className="h-4 w-4 mr-2" />
              Milestones
            </TabsTrigger>
          </TabsList>

          <div className="bg-white rounded-lg border border-slate-200 p-6 w-full">
            {/* WBS TAB CONTENT */}
            <TabsContent value="wbs" className="space-y-4 m-0">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-indigo-600" />
                  Work Breakdown Structure
                </h2>
                <div className="flex gap-2">
                  <ExportButton
                    project={project}
                    wbsItems={wbsItems}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    asChild
                    variant="outline"
                    className="text-xs border-indigo-100 text-indigo-700 hover:bg-indigo-50"
                  >
                    <Link href={`/projects/${project.id}/wbs`}>Edit Tree</Link>
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="flex flex-col items-center">
                    <Activity className="h-6 w-6 text-indigo-600 animate-spin" />
                    <p className="mt-2 text-sm text-slate-500">
                      Loading WBS items...
                    </p>
                  </div>
                </div>
              ) : wbsItems.length === 0 ? (
                <Card className="py-8 text-center bg-white border border-slate-100">
                  <CardHeader>
                    <CardTitle className="text-slate-600 text-lg">
                      No WBS items configured yet.
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Define your work breakdown structure to organize project
                      tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      asChild
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Link href={`/projects/${project.id}/wbs`}>
                        Define WBS
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {wbsItems
                    .filter((item) => !item.parent_id) // Only show root items
                    .map((item) => (
                      <Card
                        key={item.id}
                        className="bg-white border border-slate-100 hover:shadow-sm transition-all duration-200 hover:border-indigo-200"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <CardTitle className="text-base font-semibold text-slate-800">
                                {item.name}
                              </CardTitle>
                              {item.description && (
                                <CardDescription className="text-xs text-slate-500">
                                  {item.description}
                                </CardDescription>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[10px] text-slate-400 border-slate-200"
                              >
                                Weight: {item.weight}
                              </Badge>
                              <Badge
                                variant={
                                  item.status === "Completed"
                                    ? "secondary"
                                    : item.status === "In Progress"
                                      ? "default"
                                      : item.status === "Delayed"
                                        ? "destructive"
                                        : "outline"
                                }
                                className="text-xs"
                              >
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3 pt-0">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                              <span>Progress</span>
                              <span>{item.progress}%</span>
                            </div>
                            <Progress
                              value={item.progress}
                              className="w-full h-1.5"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                              <span>
                                Start:{" "}
                                {new Date(
                                  item.planned_start,
                                ).toLocaleDateString()}
                              </span>
                              <span>
                                End:{" "}
                                {new Date(
                                  item.planned_end,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>

            {/* MILESTONES TAB CONTENT */}
            <TabsContent value="milestones" className="space-y-4 m-0">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Flag className="h-5 w-5 text-emerald-600" />
                  Project Milestones
                </h2>
                <div className="flex gap-2">
                  <ExportButton
                    project={project}
                    milestones={milestones}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    asChild
                    variant="outline"
                    className="text-xs border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Link href={`/projects/${project.id}/milestones`}>
                      Manage Milestones
                    </Link>
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="flex flex-col items-center">
                    <Activity className="h-6 w-6 text-emerald-600 animate-spin" />
                    <p className="mt-2 text-sm text-slate-500">
                      Loading milestones...
                    </p>
                  </div>
                </div>
              ) : milestones.length === 0 ? (
                <Card className="py-8 text-center bg-white border border-slate-100">
                  <CardHeader>
                    <CardTitle className="text-slate-600 text-lg">
                      No milestones configured yet.
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Add milestones to track important project deadlines
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      asChild
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Link href={`/projects/${project.id}/milestones`}>
                        Add Milestones
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {milestones.map((m) => (
                    <Card
                      key={m.id}
                      className="bg-white border border-slate-100 hover:shadow-sm transition-all duration-200 hover:border-emerald-200"
                    >
                      <CardHeader className="py-3 flex flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm text-slate-700">
                            {m.name}
                          </span>
                          <Badge
                            variant={
                              m.status === "Completed"
                                ? "secondary"
                                : m.status === "Delayed"
                                  ? "destructive"
                                  : "outline"
                            }
                            className="text-[10px]"
                          >
                            {m.status}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Due:{" "}
                          {new Date(m.due_date).toLocaleDateString()}
                        </span>
                      </CardHeader>
                      {m.description && (
                        <CardContent className="pb-3 text-xs text-slate-500 pt-0">
                          {m.description}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
