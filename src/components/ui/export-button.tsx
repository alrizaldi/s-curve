"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  exportToExcel,
  exportSCurveToExcel,
  exportSCurveAsImage,
} from "@/lib/utils/excel-export";
import { Project, WBSItem, Milestone, ProgressLog } from "@/types";

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
  const handleExport = async () => {
    if (project) {
      // If project is provided, export data for this specific project
      await exportToExcel({
        projects: [project],
        wbsItems,
        milestones,
        progressLogs,
      }, `project_export_${project.name.replace(/\\s+/g, "_")}`);
    } else {
      // Export all provided data without a specific project
      await exportToExcel({
        wbsItems,
        milestones,
        progressLogs,
      }, "export_data");
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
    >
      <Download className="h-4 w-4" />
      {size !== "icon" && <span className="ml-2">Export to Excel</span>}
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
  const handleExport = async () => {
    if (chartRef && chartRef.current) {
      // Export as image if chartRef is provided
      await exportSCurveAsImage(chartRef, project.name);
    } else {
      // Fallback to Excel export if no chartRef provided
      await exportSCurveToExcel(project.id, project.name, wbsItems, progressLogs);
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
    >
      <Download className="h-4 w-4" />
      {size !== "icon" && <span className="ml-2">Export Chart</span>}
    </Button>
  );
};

export { ExportButton };