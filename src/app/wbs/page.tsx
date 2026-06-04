"use client";

import { useState, useEffect } from "react";
import { getProjects } from "@/actions/projects";
import { getWBSItems } from "@/actions/wbs";
import { getProgressLogs } from "@/actions/wbs";
import { Project, WBSItem, ProgressLog } from "@/types";
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
import { Progress } from "@/components/ui/progress";
import { FolderKanban, Search, ArrowRight, Loader2, Download } from "lucide-react";
import Link from "next/link";
import { ExportButton } from "@/components/ui/export-button";
import { GlobalExportButton } from "@/components/ui/global-export-button";

export default function GlobalWBSPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const data = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Function to get WBS items and progress logs for all projects
  const getAllWBSData = async () => {
    let allWbsItems: WBSItem[] = [];
    let allProgressLogs: ProgressLog[] = [];

    for (const project of projects) {
      const wbsItems = await getWBSItems(project.id);
      const progressLogs = await getProgressLogs(project.id);
      
      allWbsItems = [...allWbsItems, ...wbsItems];
      allProgressLogs = [...allProgressLogs, ...progressLogs];
    }

    return { wbsItems: allWbsItems, progressLogs: allProgressLogs };
  };

  const handleGlobalExport = async () => {
    const { wbsItems, progressLogs } = await getAllWBSData();
    
    // Group WBS items by project
    const groupedWBSItems: Record<string, WBSItem[]> = {};
    wbsItems.forEach(item => {
      if (!groupedWBSItems[item.project_id]) {
        groupedWBSItems[item.project_id] = [];
      }
      groupedWBSItems[item.project_id].push(item);
    });

    // Export all projects with their respective WBS items
    for (const projectId in groupedWBSItems) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        const projectWbsItems = groupedWBSItems[projectId];
        const projectLogs = progressLogs.filter(log => log.project_id === projectId);
        
        await import('xlsx').then(XLSX => {
          const wb = XLSX.default.utils.book_new();
          
          // Add WBS items sheet
          const wbsData = projectWbsItems.map(wbsItem => ({
            'ID': wbsItem.id,
            'Project ID': wbsItem.project_id,
            'Parent ID': wbsItem.parent_id || '',
            'Name': wbsItem.name,
            'Description': wbsItem.description || '',
            'Weight': wbsItem.weight,
            'Progress': wbsItem.progress,
            'Planned Start': wbsItem.planned_start.toISOString().split('T')[0],
            'Planned End': wbsItem.planned_end.toISOString().split('T')[0],
            'Status': wbsItem.status,
            'Sort Order': wbsItem.sort_order,
            'Created At': wbsItem.created_at.toISOString(),
            'Updated At': wbsItem.updated_at.toISOString()
          }));
          
          const ws = XLSX.default.utils.json_to_sheet(wbsData);
          XLSX.default.utils.book_append_sheet(wb, ws, 'WBS_Items');
          
          // Add progress logs sheet if any
          if (projectLogs.length > 0) {
            const logsData = projectLogs.map(log => ({
              'ID': log.id,
              'Project ID': log.project_id,
              'WBS Item ID': log.wbs_item_id,
              'Progress': log.progress,
              'Remarks': log.remarks || '',
              'Created By': log.created_by,
              'Created At': log.created_at.toISOString()
            }));
            
            const logWs = XLSX.default.utils.json_to_sheet(logsData);
            XLSX.default.utils.book_append_sheet(wb, logWs, 'Progress_Logs');
          }
          
          // Write the workbook to a file
          XLSX.default.writeFile(wb, `wbs_export_${project.name.replace(/\s+/g, '_')}_${project.id}.xlsx`);
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 text-white py-12 px-6 shadow-md">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center space-x-3 mb-3">
            <FolderKanban className="h-8 w-8 text-indigo-200 animate-pulse" />
            <Badge
              variant="secondary"
              className="bg-indigo-500/30 text-indigo-100 hover:bg-indigo-500/40 border-indigo-400/20"
            >
              WBS Module
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Work Breakdown Structure (WBS)
          </h1>
          <p className="text-indigo-100 max-w-2xl text-sm md:text-base font-light">
            Select a project to define, organize, and manage its hierarchical
            work packages, phases, and tasks.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-8 px-6">
        {/* Search and Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search projects by name or description..."
              className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {["all", "Active", "Draft", "Completed", "Cancelled"].map(
              (status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize text-xs rounded-lg transition-all"
                >
                  {status === "all" ? "All Statuses" : status}
                </Button>
              ),
            )}
            <GlobalExportButton
              variant="outline"
              size="sm"
              className="text-xs rounded-lg transition-all flex items-center gap-1"
            />
          </div>
        </div>

        {/* Projects Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
            <p className="text-sm text-slate-500 font-medium animate-pulse">
              Loading active projects...
            </p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-2 border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-slate-600 text-lg font-medium">
                No Projects Found
              </CardTitle>
              <CardDescription className="text-slate-400">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "Get started by creating your first project in the Projects section."}
              </CardDescription>
            </CardHeader>
            {!searchTerm && statusFilter === "all" && (
              <CardContent>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                  <Link href="/projects">Go to Projects</Link>
                </Button>
              </CardContent>
            )}
          </Card>
        ) : (
          /* Grid list of projects with rich aesthetics */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="group bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 border border-slate-100 flex flex-col justify-between overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge
                      variant={
                        project.status === "Active"
                          ? "default"
                          : project.status === "Completed"
                            ? "secondary"
                            : project.status === "Cancelled"
                              ? "destructive"
                              : "outline"
                      }
                      className="text-xs"
                    >
                      {project.status}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {new Date(project.start_date).getFullYear()}
                    </span>
                  </div>
                  <CardTitle className="text-base font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors duration-200">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs text-slate-500 mt-1 min-h-[32px]">
                    {project.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col justify-end gap-4">
                  {/* Visual Progress Rollup */}
                  <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between text-[11px] font-medium text-slate-600">
                      <span>WBS Rollup Progress</span>
                      <span>{(project as any).progress ?? 0}%</span>
                    </div>
                    <Progress
                      value={(project as any).progress ?? 0}
                      className="h-1.5 bg-slate-200"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2 text-xs border-t border-slate-50">
                    <span className="text-slate-400">
                      {new Date(project.start_date).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" },
                      )}{" "}
                      -{" "}
                      {new Date(project.end_date).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric" },
                      )}
                    </span>
                    <div className="flex gap-2">
                      <ExportButton
                        project={project}
                        variant="ghost"
                        size="sm"
                        className="text-xs px-2"
                      />
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium group/btn"
                      >
                        <Link
                          href={`/projects/${project.id}/wbs`}
                          className="flex items-center gap-1"
                        >
                          Manage WBS{" "}
                          <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
