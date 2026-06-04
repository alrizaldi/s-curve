'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SChartDataPoint } from '@/types';
import { calculatePlannedCurve, calculateActualCurve, combineCurves } from '@/services/scurve';

// Mock data for demonstration
const mockWBSItems = [
  {
    id: '1',
    project_id: 'proj-1',
    parent_id: undefined,
    name: 'Phase 1',
    description: 'Initial project phase',
    weight: 30,
    progress: 45,
    planned_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    planned_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    status: 'In Progress' as const, // Explicitly typed to match WBSItemStatus
    sort_order: 1,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updated_at: new Date(),
  },
  {
    id: '2',
    project_id: 'proj-1',
    parent_id: undefined,
    name: 'Phase 2',
    description: 'Second project phase',
    weight: 40,
    progress: 10,
    planned_start: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    planned_end: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    status: 'Not Started' as const, // Explicitly typed to match WBSItemStatus
    sort_order: 2,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updated_at: new Date(),
  }
];

const mockProgressLogs = [
  {
    id: 'log-1',
    project_id: 'proj-1',
    wbs_item_id: '1',
    progress: 15,
    remarks: 'Initial progress',
    created_by: 'user-1',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'log-2',
    project_id: 'proj-1',
    wbs_item_id: '1',
    progress: 20,
    remarks: 'Mid-phase progress',
    created_by: 'user-1',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'log-3',
    project_id: 'proj-1',
    wbs_item_id: '1',
    progress: 10,
    remarks: 'Additional progress',
    created_by: 'user-1',
    created_at: new Date(Date.now()),
  }
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
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">S-Curve Visualization</h1>
        <p className="text-muted-foreground mt-2">
          Compare planned versus actual project progress over time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
            <CardDescription>Overall project progress comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Planned Progress</p>
                <p className="text-2xl font-bold">{latestPoint?.planned ?? 0}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actual Progress</p>
                <p className="text-2xl font-bold">{latestPoint?.actual ?? 0}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Variance</p>
                <p className={`text-2xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {variance >= 0 ? '+' : ''}{variance.toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Indicator</CardTitle>
            <CardDescription>Project health based on variance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded-full ${
                variance >= 0 ? 'bg-green-500' : 
                variance > -10 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <div>
                <p className="font-semibold">
                  {variance >= 0 ? 'On Track' : 
                   variance > -10 ? 'Slight Delay' : 'Critical Delay'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {variance >= 0 
                    ? 'Project is ahead or on schedule' 
                    : variance > -10 
                      ? 'Minor delays detected' 
                      : 'Significant delays require attention'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Actionable insights</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {variance < 0 ? (
                <>
                  <li>Review critical path activities</li>
                  <li>Consider resource reallocation</li>
                  <li>Update timeline estimates</li>
                </>
              ) : (
                <>
                  <li>Maintain current pace</li>
                  <li>Monitor for potential scope creep</li>
                  <li>Plan for next phase transition</li>
                </>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress Over Time</CardTitle>
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
                  tickFormatter={(value) => new Date(value).toLocaleDateString()} 
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Progress']}
                  labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
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
        <Card>
          <CardHeader>
            <CardTitle>Planned vs Actual Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Early Phase (Start - 25%)</span>
                <div className="flex space-x-2">
                  <Badge variant="secondary">Planned: 25%</Badge>
                  <Badge variant={25 >= 25 ? "secondary" : "outline"}>Actual: 25%</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Middle Phase (25% - 75%)</span>
                <div className="flex space-x-2">
                  <Badge variant="secondary">Planned: 50%</Badge>
                  <Badge variant={45 >= 50 ? "secondary" : "outline"}>Actual: 45%</Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Late Phase (75% - 100%)</span>
                <div className="flex space-x-2">
                  <Badge variant="secondary">Planned: 100%</Badge>
                  <Badge variant={45 >= 100 ? "secondary" : "outline"}>Actual: 45%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>The project is currently behind the planned schedule</li>
              <li>Early phases were completed on time but momentum has slowed</li>
              <li>Immediate action required to get back on track</li>
              <li>Focus on high-weight activities to maximize impact</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}