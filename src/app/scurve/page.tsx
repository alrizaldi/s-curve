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
import { SChartDataPoint } from "@/types";
import {
  calculatePlannedCurve,
  calculateActualCurve,
  combineCurves,
} from "@/services/scurve";
import { TrendingUp, AlertTriangle, CheckCircle, Activity } from "lucide-react";

// Mock data for demonstration
const mockWBSItems = [
  {
    id: "1",
    project_id: "proj-1",
    parent_id: undefined,
    name: "Phase 1",
    description: "Initial project phase",
    weight: 30,
    progress: 45,
    planned_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    planned_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    status: "In Progress" as const, // Explicitly typed to match WBSItemStatus
    sort_order: 1,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updated_at: new Date(),
  },
  {
    id: "2",
    project_id: "proj-1",
    parent_id: undefined,
    name: "Phase 2",
    description: "Second project phase",
    weight: 40,
    progress: 10,
    planned_start: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    planned_end: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    status: "Not Started" as const, // Explicitly typed to match WBSItemStatus
    sort_order: 2,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updated_at: new Date(),
  },
];

const mockProgressLogs = [
  {
    id: "log-1",
    project_id: "proj-1",
    wbs_item_id: "1",
    progress: 15,
    remarks: "Initial progress",
    created_by: "user-1",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: "log-2",
    project_id: "proj-1",
    wbs_item_id: "1",
    progress: 20,
    remarks: "Mid-phase progress",
    created_by: "user-1",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "log-3",
    project_id: "proj-1",
    wbs_item_id: "1",
    progress: 10,
    remarks: "Additional progress",
    created_by: "user-1",
    created_at: new Date(Date.now()),
  },
];

export default function SCurvePage() {
  // Calculate the S-Curve data
  const plannedData = calculatePlannedCurve(mockWBSItems);
  const actualData = calculateActualCurve(mockProgressLogs, mockWBSItems);
  const combinedData = combineCurves(plannedData, actualData);

  // Calculate overall variance
  const latestPoint = combinedData[combinedData.length - 1];
  const variance = latestPoint ? latestPoint.actual - latestPoint.planned : 0;

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="group hover:shadow-lg transition-all duration-300 border border-slate-100 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Activity className="h-5 w-5 text-blue-600" />
                Current Status
              </CardTitle>
              <CardDescription>
                Overall project progress comparison
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
                Project health based on variance
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
            <CardDescription>Planned vs Actual progress curve</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
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
                      Actual: 25%
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
                      variant={45 >= 50 ? "secondary" : "outline"}
                      className={
                        45 >= 50
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }
                    >
                      Actual: 45%
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
                      variant={45 >= 100 ? "secondary" : "outline"}
                      className={
                        45 >= 100
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }
                    >
                      Actual: 45%
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
                  The project is currently{" "}
                  <span className="font-medium">
                    behind the planned schedule
                  </span>
                </li>
                <li className="text-slate-600">
                  <span className="font-medium">Early phases</span> were
                  completed on time but momentum has slowed
                </li>
                <li className="text-slate-600">
                  <span className="font-medium">Immediate action</span> required
                  to get back on track
                </li>
                <li className="text-slate-600">
                  <span className="font-medium">Focus on high-weight</span>{" "}
                  activities to maximize impact
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
