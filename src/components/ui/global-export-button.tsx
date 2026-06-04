'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '@/lib/utils/excel-export';
import { Project, WBSItem, Milestone, ProgressLog } from '@/types';
import { getProjects } from '@/actions/projects';
import { getWBSItems } from '@/actions/wbs';
import { getMilestones } from '@/actions/milestones';
import { getProgressLogs } from '@/actions/wbs';

interface GlobalExportButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'secondary' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

const GlobalExportButton: React.FC<GlobalExportButtonProps> = ({
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false
}) => {
  const handleGlobalExport = async () => {
    try {
      // Fetch all data for export
      const [projects, allProgressLogs] = await Promise.all([
        getProjects(),
        getProgressLogs() // This now gets all logs when no project ID is provided
      ]);

      // Fetch WBS items and milestones for all projects
      let allWbsItems: WBSItem[] = [];
      let allMilestones: Milestone[] = [];

      for (const project of projects) {
        const [wbsItems, milestones] = await Promise.all([
          getWBSItems(project.id),
          getMilestones(project.id)
        ]);
        
        allWbsItems = [...allWbsItems, ...wbsItems];
        allMilestones = [...allMilestones, ...milestones];
      }

      // Export all data
      await exportToExcel({
        projects,
        wbsItems: allWbsItems,
        milestones: allMilestones,
        progressLogs: allProgressLogs
      }, 'global_project_export');
    } catch (error) {
      console.error('Error during global export:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <Button
      onClick={handleGlobalExport}
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
    >
      <FileSpreadsheet className="h-4 w-4 mr-2" />
      Global Export
    </Button>
  );
};

export { GlobalExportButton };