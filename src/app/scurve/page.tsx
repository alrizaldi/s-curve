"use client";

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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SChartDataPoint, WBSItem, ProgressLog, Project } from "@/types";
import { getWBSItems, getProgressLogs } from "@/actions/wbs"; // Import only getWBSItems and getProgressLogs from wbs
import { getProjects } from "@/actions/projects"; // Import getProjects from the correct location
import {
  calculatePlannedCurve,
  calculateActualCurve,
  combineCurves,
} from "@/services/scurve";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Loader2,
  Download,
} from "lucide-react";
import { useEffect, useState, useRef } from "react"; // Add useRef for chart export
import { SCurveExportButton } from "@/components/ui/export-button";

export default function SCurvePage() {
  const [wbsItems, setWbsItems] = useState<WBSItem[]>([]);
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null); // null for initial empty, "all" for all projects, otherwise project ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null); // Ref for chart container for export

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        // Get all projects first
        const allProjects = await getProjects();
        setProjects(allProjects);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load projects",
        );
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let projectWbsItems: WBSItem[] = [];
        let projectProgressLogs: ProgressLog[] = [];

        if (selectedProject === "all") {
          // Get all projects to combine data from all projects
          for (const project of projects) {
            const wbsItemsForProject = await getWBSItems(project.id);
            projectWbsItems = [...projectWbsItems, ...wbsItemsForProject];

            const progressLogsForProject = await getProgressLogs(project.id);
            projectProgressLogs = [
              ...projectProgressLogs,
              ...progressLogsForProject,
            ];
          }
        } else if (selectedProject) {
          // Get data for specific project only
          projectWbsItems = await getWBSItems(selectedProject);
          projectProgressLogs = await getProgressLogs(selectedProject);
        } else {
          // If no project is selected (empty string), reset the arrays
          projectWbsItems = [];
          projectProgressLogs = [];
        }

        setWbsItems(projectWbsItems);
        setProgressLogs(projectProgressLogs);
      } catch (err) {
        console.error("Error fetching S-Curve data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load S-Curve data",
        );
      } finally {
        setLoading(false);
      }
    };

    if (projects.length > 0) {
      fetchData();
    }
  }, [selectedProject, projects]);

  // Calculate the S-Curve data using real data
  const plannedData = calculatePlannedCurve(wbsItems);
  const actualData = calculateActualCurve(progressLogs, wbsItems);
  const combinedData = combineCurves(plannedData, actualData);

  // Calculate overall variance
  const latestPoint = combinedData[combinedData.length - 1];
  const variance = latestPoint ? latestPoint.actual - latestPoint.planned : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
          <p className="text-slate-600">Loading S-Curve data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="flex flex-col items-center text-center p-8 bg-white rounded-xl border border-red-200 max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Error Loading Data
          </h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-700 to-purple-800 text-white py-12 px-6 shadow-md">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center space-x-3 mb-3">
            <TrendingUp className="h-8 w-8 text-rose-200 animate-pulse" />
            <Badge
              variant="secondary"
              className="bg-rose-500/30 text-rose-100 hover:bg-rose-500/40 border-rose-400/20"
            >
              S-Curve Module
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            S-Curve Visualization
          </h1>
          <p className="text-rose-100 max-w-2xl text-sm md:text-base font-light">
            Compare planned versus actual project progress over time
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-8 px-6">
        {/* Project Selection Dropdown moved to top of main content */}
        <div className="mb-6">
          <label
            htmlFor="project-select"
            className="block text-sm font-medium text-black mb-2"
          >
            Select Project:
          </label>
          <select
            id="project-select"
            value={selectedProject || ""}
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-rose-300 w-full md:w-auto"
          >
            <option value="">Select a project...</option>
            <option value="all">All Projects (Combined)</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Export button for the selected project */}
        {selectedProject !== "all" && selectedProject !== "" && (
          <div className="mb-6 flex justify-end">
            <SCurveExportButton
              project={
                projects.find((p) => p.id === selectedProject) || projects[0]
              }
              wbsItems={wbsItems}
              progressLogs={progressLogs}
              chartRef={chartRef} // Pass the chart ref to the export button
              variant="default"
              size="sm"
              className="text-xs"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Activity className="h-5 w-5 text-blue-600" />
                Current Status
              </CardTitle>
              <CardDescription>
                {selectedProject === "all" || selectedProject === ""
                  ? "Overall project progress comparison"
                  : `Progress for "${projects.find((p) => p.id === selectedProject)?.name}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-sm text-slate-500">Planned Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {latestPoint?.planned ?? 0}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500">Actual Progress</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {latestPoint?.actual ?? 0}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-500">Variance</p>
                  <p
                    className={`text-2xl font-bold ${variance >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {variance >= 0 ? "+" : ""}
                    {variance.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                Status Indicator
              </CardTitle>
              <CardDescription>
                {selectedProject === "all" || selectedProject === ""
                  ? "Overall project health based on variance"
                  : "Project health based on variance"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div
                  className={`w-4 h-4 rounded-full ${
                    variance >= 0
                      ? "bg-green-500"
                      : variance > -10
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                ></div>
                <div>
                  <p className="font-semibold text-slate-700">
                    {variance >= 0
                      ? "On Track"
                      : variance > -10
                        ? "Slight Delay"
                        : "Critical Delay"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {variance >= 0
                      ? "Project is ahead or on schedule"
                      : variance > -10
                        ? "Minor delays detected"
                        : "Significant delays require attention"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Recommendations
              </CardTitle>
              <CardDescription>Actionable insights</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {variance < 0 ? (
                  <>
                    <li className="text-slate-600">
                      <span className="font-medium">Review critical path</span>{" "}
                      activities
                    </li>
                    <li className="text-slate-600">
                      <span className="font-medium">Consider resource</span>{" "}
                      reallocation
                    </li>
                    <li className="text-slate-600">
                      <span className="font-medium">Update timeline</span>{" "}
                      estimates
                    </li>
                  </>
                ) : (
                  <>
                    <li className="text-slate-600">
                      <span className="font-medium">Maintain current</span> pace
                    </li>
                    <li className="text-slate-600">
                      <span className="font-medium">Monitor for potential</span>{" "}
                      scope creep
                    </li>
                    <li className="text-slate-600">
                      <span className="font-medium">Plan for next</span> phase
                      transition
                    </li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Progress Over Time
            </CardTitle>
            <CardDescription>
              {selectedProject === "all" || selectedProject === ""
                ? "Planned vs Actual progress curve (All Projects)"
                : `Planned vs Actual progress curve for "${projects.find((p) => p.id === selectedProject)?.name}"`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96" ref={chartRef}>
              {" "}
              {/* Add ref to the chart container */}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={combinedData}
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
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Activity className="h-5 w-5 text-cyan-600" />
                Planned vs Actual Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-slate-700">
                    Early Phase (Start - 25%)
                  </span>
                  <div className="flex space-x-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      Planned: 25%
                    </Badge>
                    <Badge
                      variant={25 >= 25 ? "secondary" : "outline"}
                      className={
                        25 >= 25
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }
                    >
                      Actual: {Math.min(25, latestPoint?.actual || 0)}%
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-slate-700">
                    Middle Phase (25% - 75%)
                  </span>
                  <div className="flex space-x-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      Planned: 50%
                    </Badge>
                    <Badge
                      variant={
                        Math.max(0, Math.min(50, latestPoint?.actual || 0)) >=
                        50
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        Math.max(0, Math.min(50, latestPoint?.actual || 0)) >=
                        50
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }
                    >
                      Actual:{" "}
                      {Math.max(0, Math.min(50, latestPoint?.actual || 0))}%
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-slate-700">
                    Late Phase (75% - 100%)
                  </span>
                  <div className="flex space-x-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      Planned: 100%
                    </Badge>
                    <Badge
                      variant={
                        Math.max(0, Math.min(100, latestPoint?.actual || 0)) >=
                        100
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        Math.max(0, Math.min(100, latestPoint?.actual || 0)) >=
                        100
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }
                    >
                      Actual:{" "}
                      {Math.max(0, Math.min(100, latestPoint?.actual || 0))}%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li className="text-slate-600">
                  Selected Project:{" "}
                  <span className="font-medium">
                    {selectedProject === ""
                      ? "None Selected"
                      : selectedProject === "all"
                        ? "All Projects Combined"
                        : projects.find((p) => p.id === selectedProject)?.name}
                  </span>
                </li>
                <li className="text-slate-600">
                  Total WBS Items Analyzed:{" "}
                  <span className="font-medium">{wbsItems.length}</span>
                </li>
                <li className="text-slate-600">
                  Total Progress Logs:{" "}
                  <span className="font-medium">{progressLogs.length}</span>
                </li>
                <li className="text-slate-600">
                  Data Range:{" "}
                  <span className="font-medium">
                    {combinedData.length > 0
                      ? `${combinedData[0].date} to ${combinedData[combinedData.length - 1].date}`
                      : "No data available"}
                  </span>
                </li>
                <li className="text-slate-600">
                  {combinedData.length > 0
                    ? "The project is currently " +
                      (variance >= 0
                        ? "ahead of or on track with the planned schedule"
                        : "behind the planned schedule")
                    : "No progress data available yet"}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
