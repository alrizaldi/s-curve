"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/actions/projects";
import { ProjectFormValues } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<
    Omit<ProjectFormValues, "start_date" | "end_date"> & {
      start_date: string;
      end_date: string;
    }
  >({
    name: "",
    description: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // Default to 30 days from now
    status: "Draft",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert date strings to Date objects
      const projectData: ProjectFormValues = {
        ...formData,
        start_date: new Date(formData.start_date),
        end_date: new Date(formData.end_date),
      };

      const newProject = await createProject(projectData);

      // Redirect to the newly created project page
      router.push(`/projects/${newProject.id}`);
      router.refresh(); // Refresh to update any cached data
    } catch (err) {
      console.error("Error creating project:", err);
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-700 to-indigo-800 text-white py-12 px-6 shadow-md">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center space-x-3 mb-3">
            <Building2 className="h-8 w-8 text-violet-200 animate-pulse" />
            <Badge
              variant="secondary"
              className="bg-violet-500/30 text-violet-100 hover:bg-violet-500/40 border-violet-400/20"
            >
              Create Project
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            New Project
          </h1>
          <p className="text-violet-100 max-w-2xl text-sm md:text-base font-light">
            Fill in the details to create a new project
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl py-8 px-6">
        <Card className="bg-white border border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Building2 className="h-5 w-5 text-violet-600" />
              Project Details
            </CardTitle>
            <CardDescription>
              Enter the basic information for your new project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-700">
                    Project Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter project name"
                    required
                    className="mt-1 bg-slate-50 border-slate-200 focus:bg-white focus:border-violet-300"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-slate-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter project description"
                    rows={3}
                    className="mt-1 bg-slate-50 border-slate-200 focus:bg-white focus:border-violet-300"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="start_date" className="text-slate-700">
                      Start Date *
                    </Label>
                    <div className="relative">
                      <Input
                        type="date"
                        id="start_date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        required
                        className="mt-1 bg-slate-50 border-slate-200 focus:bg-white focus:border-violet-300 pl-9"
                      />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="end_date" className="text-slate-700">
                      End Date *
                    </Label>
                    <div className="relative">
                      <Input
                        type="date"
                        id="end_date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        required
                        className="mt-1 bg-slate-50 border-slate-200 focus:bg-white focus:border-violet-300 pl-9"
                      />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="status" className="text-slate-700">
                    Status
                  </Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-violet-500 focus:border-violet-300"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-violet-600 hover:bg-violet-700 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Create Project
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
