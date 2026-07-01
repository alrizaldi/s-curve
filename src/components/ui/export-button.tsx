"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import {
  exportToExcel,
  exportSCurveToExcel,
  exportSCurveAsImage,
  exportProjectToExcel,
} from "@/lib/utils/excel-export";
import { Project, WBSItem, Milestone, ProgressLog } from "@/types";
import { useState } from "react";

interface ExportButtonProps {
  project?: Project;
  wbsItems?: WBSItem[];
  milestones?: Milestone[];
  progressLogs?: ProgressLog[];
  variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  project,
  wbsItems = [],
  milestones = [],
  progressLogs = [],
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      if (project) {
        // If project is provided, export data for this specific project
        await exportToExcel({
          projects: [project],
          wbsItems,
          milestones,
          progressLogs,
        }, `project_export_${project.name.replace(/\s+/g, "_")}`);
      } else {
        // Export all provided data without a specific project
        await exportToExcel({
          wbsItems,
          milestones,
          progressLogs,
        }, "export_data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant={variant}
      size={size}
      className={className}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {size !== "icon" && <span>Export Data</span>}
        </>
      )}
    </Button>
  );
};

export const SCurveExportButton: React.FC<{
  project: Project;
  wbsItems: WBSItem[];
  progressLogs: ProgressLog[];
  chartRef?: React.RefObject<HTMLDivElement>; // New prop for chart reference
  variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
}> = ({
  project,
  wbsItems,
  progressLogs,
  chartRef, // Accept chartRef prop
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      if (chartRef && chartRef.current) {
        // Export as image if chartRef is provided
        await exportSCurveAsImage(chartRef, project.name);
      } else {
        // Fallback to Excel export if no chartRef provided
        await exportSCurveToExcel(project.id, project.name, wbsItems, progressLogs);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant={variant}
      size={size}
      className={className}
      disabled={isLoading || disabled}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {size !== "icon" && <span>Export Chart</span>}
        </>
      )}
    </Button>
  );
};

interface ProjectExportButtonProps {
  projectId: string;
  projectName: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ProjectExportButton({ 
  projectId, 
  projectName, 
  className,
  variant = "default",
  size = "default"
}: ProjectExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      // Dynamically import the export function to avoid SSR issues
      await exportProjectToExcel(projectId, projectName);
    } catch (error) {
      console.error("Error exporting project:", error);
      alert("Failed to export project data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </>
      )}
    </Button>
  );
}

export { ExportButton };
