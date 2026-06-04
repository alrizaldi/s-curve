"use client";

import { useState, useEffect } from "react";
import { getProjects } from "@/actions/projects";
import { Project } from "@/types";
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
import { Flag, Search, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function GlobalMilestonesPage() {
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

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 text-white py-12 px-6 shadow-md">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center space-x-3 mb-3">
            <Flag className="h-8 w-8 text-emerald-200 animate-bounce" />
            <Badge
              variant="secondary"
              className="bg-emerald-500/30 text-emerald-100 hover:bg-emerald-500/40 border-emerald-400/20"
            >
              Milestones Module
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Project Milestones
          </h1>
          <p className="text-emerald-100 max-w-2xl text-sm md:text-base font-light">
            Select a project to define key target milestones, track delivery
            dates, and monitor actual completion events.
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
          </div>
        </div>

        {/* Projects Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-4" />
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
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
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
                  <CardTitle className="text-base font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors duration-200">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs text-slate-500 mt-1 min-h-[32px]">
                    {project.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col justify-end gap-4">
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-xs">
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
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium group/btn"
                    >
                      <Link
                        href={`/projects/${project.id}/milestones`}
                        className="flex items-center gap-1"
                      >
                        Milestones{" "}
                        <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </Button>
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
