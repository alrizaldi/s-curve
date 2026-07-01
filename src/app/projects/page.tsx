"use client";

import { useProjects } from "@/hooks/useProjects";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  FolderOpen,
  Building2,
  Calendar,
  User,
  RotateCcw,
  Download,
} from "lucide-react";
import Link from "next/link";
import { ProjectExportButton } from "@/components/ui/export-button";

export default function ProjectsPage() {
  const { projects, loading, error, refetch } = useProjects();

  // Function to create a sample project with halfway progress
  const createSampleProject = async () => {
    try {
      const response = await fetch("/api/sample-project", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        refetch(); // Refresh the project list
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (err) {
      console.error("Error creating sample project:", err);
      alert("An error occurred while creating the sample project");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        {/* Premium Header Banner */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-700 to-indigo-800 text-white py-12 px-6 shadow-md">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center space-x-3 mb-3">
              <Building2 className="h-8 w-8 text-violet-200 animate-pulse" />
              <Badge
                variant="secondary"
                className="bg-violet-500/30 text-violet-100 hover:bg-violet-500/40 border-violet-400/20"
              >
                Module 2
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Projects Management
            </h1>
            <p className="text-violet-100 max-w-2xl text-sm md:text-base font-light">
              Create, manage, and track all your projects in one place.
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl py-8 px-6">
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
              <p className="text-slate-500 font-medium">Loading projects...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        {/* Premium Header Banner */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-700 to-indigo-800 text-white py-12 px-6 shadow-md">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center space-x-3 mb-3">
              <Building2 className="h-8 w-8 text-violet-200 animate-pulse" />
              <Badge
                variant="secondary"
                className="bg-violet-500/30 text-violet-100 hover:bg-violet-500/40 border-violet-400/20"
              >
                Module 2
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Projects Management
            </h1>
            <p className="text-violet-100 max-w-2xl text-sm md:text-base font-light">
              Create, manage, and track all your projects in one place.
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl py-8 px-6">
          <div className="flex justify-center items-center py-20">
            <Card className="text-center py-8 px-6 max-w-md">
              <CardHeader>
                <CardTitle className="text-slate-800">
                  Error Loading Projects
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {error}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => refetch()}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-700 to-indigo-800 text-white py-12 px-6 shadow-md">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center space-x-3 mb-3">
            <Building2 className="h-8 w-8 text-violet-200 animate-pulse" />
            <Badge
              variant="secondary"
              className="bg-violet-500/30 text-violet-100 hover:bg-violet-500/40 border-violet-400/20"
            >
              Module 2
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Projects Management
          </h1>
          <p className="text-violet-100 max-w-2xl text-sm md:text-base font-light">
            Create, manage, and track all your projects in one place.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-8 px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">All Projects</h2>
            <p className="text-slate-500">Manage your project portfolio</p>
          </div>
          <div className="flex gap-2">
            {/* <Button 
              onClick={createSampleProject} 
              className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" /> Create Sample Project
            </Button> */}
            <Button
              asChild
              className="bg-violet-600 hover:bg-violet-700 flex items-center gap-2"
            >
              <Link href="/projects/new">
                <PlusCircle className="h-4 w-4" /> Create Project
              </Link>
            </Button>
          </div>
        </div>

        {projects.length === 0 ? (
          <Card className="py-16 text-center border-2 border-dashed border-slate-200 bg-white">
            <CardHeader>
              <div className="mx-auto bg-violet-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <FolderOpen className="h-6 w-6 text-violet-600" />
              </div>
              <CardTitle className="text-slate-800">No projects yet</CardTitle>
              <CardDescription className="text-slate-500">
                Create your first project to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-violet-600 hover:bg-violet-700">
                <Link href="/projects/new">Create Project</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-slate-100 bg-white overflow-hidden"
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
                      className="text-xs px-2 py-1"
                    >
                      {project.status}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {new Date(project.start_date).getFullYear()}
                    </span>
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-800 group-hover:text-violet-600 transition-colors">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-slate-500 mt-1 min-h-[32px]">
                    {project.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="h-4 w-4 mr-2 text-violet-500" />
                      <span>
                        {new Date(project.start_date).toLocaleDateString()} -{" "}
                        {new Date(project.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-violet-100 text-violet-700 hover:bg-violet-50 flex items-center gap-1"
                      >
                        <Link
                          href={`/projects/${project.id}`}
                          className="flex items-center gap-1"
                        >
                          View Details{" "}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </Link>
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Link href={`/projects/${project.id}/wbs`}>
                            Manage WBS
                          </Link>
                        </Button>
                        {/* <ProjectExportButton
                          projectId={project.id}
                          projectName={project.name}
                          variant="outline" // Added to match other buttons
                          size="sm"         // Added to match other buttons
                          className="h-7 px-2.5 border-slate-200 text-slate-700 hover:bg-slate-50" // Updated to match other buttons
                        /> */}
                      </div>
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
