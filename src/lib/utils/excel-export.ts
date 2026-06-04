import { Project, WBSItem, Milestone, ProgressLog } from '@/types';
import { calculatePlannedCurve, calculateActualCurve, combineCurves } from '@/services/scurve';

// Helper function to safely convert date strings to dates
const safeDateToString = (date: Date | string | undefined | null, defaultValue: string = ''): string => {
  if (!date) return defaultValue;
  if (typeof date === 'string') {
    return new Date(date).toISOString().split('T')[0];
  }
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return defaultValue;
};

// Helper function to safely convert date to ISO string
const safeDateToISO = (date: Date | string | undefined | null, defaultValue: string = ''): string => {
  if (!date) return defaultValue;
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  if (date instanceof Date) {
    return date.toISOString();
  }
  return defaultValue;
};

export const exportToExcel = async (data: any, fileName: string) => {
  try {
    // Dynamically import xlsx to avoid SSR issues
    const xlsxModule = await import('xlsx');
    const XLSX = xlsxModule.default || xlsxModule;

    if (!XLSX || typeof XLSX.utils === 'undefined') {
      throw new Error('XLSX library is not properly loaded');
    }

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Export projects sheet if provided
    if (data.projects && data.projects.length > 0) {
      const projectsData = data.projects.map((project: any) => ({
        'ID': project.id,
        'Name': project.name,
        'Description': project.description || '',
        'Start Date': safeDateToString(project.start_date),
        'End Date': safeDateToString(project.end_date),
        'Status': project.status,
        'Created By': project.created_by,
        'Created At': safeDateToISO(project.created_at),
        'Updated At': safeDateToISO(project.updated_at)
      }));

      const ws = XLSX.utils.json_to_sheet(projectsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    }

    // Export WBS items sheet if provided
    if (data.wbsItems && data.wbsItems.length > 0) {
      const wbsData = data.wbsItems.map((wbsItem: any) => ({
        'ID': wbsItem.id,
        'Project ID': wbsItem.project_id,
        'Parent ID': wbsItem.parent_id || '',
        'Name': wbsItem.name,
        'Description': wbsItem.description || '',
        'Weight': wbsItem.weight,
        'Progress': wbsItem.progress,
        'Planned Start': safeDateToString(wbsItem.planned_start),
        'Planned End': safeDateToString(wbsItem.planned_end),
        'Status': wbsItem.status,
        'Sort Order': wbsItem.sort_order,
        'Created At': safeDateToISO(wbsItem.created_at),
        'Updated At': safeDateToISO(wbsItem.updated_at)
      }));

      const ws = XLSX.utils.json_to_sheet(wbsData);
      XLSX.utils.book_append_sheet(wb, ws, 'WBS_Items');
    }

    // Export milestones sheet if provided
    if (data.milestones && data.milestones.length > 0) {
      const milestonesData = data.milestones.map((milestone: any) => ({
        'ID': milestone.id,
        'Project ID': milestone.project_id,
        'Name': milestone.name,
        'Description': milestone.description || '',
        'Target Date': safeDateToString(milestone.due_date),
        'Status': milestone.status,
        'Achieved Date': safeDateToString(milestone.completed_date),
        'Created At': safeDateToISO(milestone.created_at),
        'Updated At': safeDateToISO(milestone.updated_at)
      }));

      const ws = XLSX.utils.json_to_sheet(milestonesData);
      XLSX.utils.book_append_sheet(wb, ws, 'Milestones');
    }

    // Export progress logs sheet if provided
    if (data.progressLogs && data.progressLogs.length > 0) {
      const logsData = data.progressLogs.map((log: any) => ({
        'ID': log.id,
        'Project ID': log.project_id,
        'WBS Item ID': log.wbs_item_id,
        'Progress': log.progress,
        'Remarks': log.remarks || '',
        'Created By': log.created_by,
        'Created At': safeDateToISO(log.created_at)
      }));

      const ws = XLSX.utils.json_to_sheet(logsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Progress_Logs');
    }

    // Write the workbook to a file
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};

export const exportSCurveToExcel = async (projectId: string, projectName: string, wbsItems: WBSItem[], progressLogs: ProgressLog[]) => {
  try {
    // Dynamically import xlsx to avoid SSR issues
    const xlsxModule = await import('xlsx');
    const XLSX = xlsxModule.default || xlsxModule;

    if (!XLSX || typeof XLSX.utils === 'undefined') {
      throw new Error('XLSX library is not properly loaded');
    }

    // Calculate S-Curve data
    const plannedData = calculatePlannedCurve(wbsItems);
    const actualData = calculateActualCurve(progressLogs, wbsItems);
    const combinedData = combineCurves(plannedData, actualData);

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // S-Curve data sheet
    const scurveData = combinedData.map(point => ({
      'Date': point.date,
      'Planned (%)': point.planned,
      'Actual (%)': point.actual,
      'Variance (%)': (point.actual - point.planned).toFixed(2)
    }));

    const ws = XLSX.utils.json_to_sheet(scurveData);
    XLSX.utils.book_append_sheet(wb, ws, 'S_Curve_Data');

    // Write the workbook to a file
    XLSX.writeFile(wb, `scurve_${projectName.replace(/\s+/g, '_')}_${projectId}.xlsx`);
  } catch (error) {
    console.error('Error exporting S-Curve to Excel:', error);
    throw new Error('Failed to export S-Curve data to Excel');
  }
};

// New function to export S-Curve as image
export const exportSCurveAsImage = async (chartRef: React.RefObject<HTMLDivElement>, projectName: string) => {
  try {
    // Dynamically import html2canvas to capture the chart as an image
    const html2canvas = (await import('html2canvas')).default;
    
    if (!chartRef.current) {
      throw new Error('Chart container not found');
    }

    // Capture the chart element as canvas
    const canvas = await html2canvas(chartRef.current, {
      scale: 2, // Higher resolution
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Convert canvas to data URL
    const imageDataUrl = canvas.toDataURL('image/png');

    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `scurve_chart_${projectName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting S-Curve as image:', error);
    throw new Error('Failed to export S-Curve as image');
  }
};