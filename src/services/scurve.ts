import { WBSItem, ProgressLog, SChartDataPoint } from '@/types';

/**
 * Formats a date to YYYY-MM-DD format
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate planned progress for S-Curve based on WBS items
 */
export function calculatePlannedCurve(wbsItems: WBSItem[]): SChartDataPoint[] {
  // Group WBS items by planned start and end dates
  const dateMap = new Map<string, { weight: number; progress: number }>();
  
  // Calculate daily planned progress based on weights and time spans
  for (const item of wbsItems) {
    const startDate = new Date(item.planned_start);
    const endDate = new Date(item.planned_end);
    
    // Calculate the duration in days
    const duration = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate daily planned progress based on weight
    const dailyProgress = item.weight / duration;
    
    // Distribute the planned progress over the duration
    for (let i = 0; i <= duration; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = formatDate(currentDate);
      
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { weight: 0, progress: 0 });
      }
      
      const current = dateMap.get(dateStr)!;
      dateMap.set(dateStr, {
        weight: current.weight + item.weight,
        progress: current.progress + dailyProgress
      });
    }
  }
  
  // Convert map to sorted array and calculate cumulative progress
  let cumulativeProgress = 0;
  const result: SChartDataPoint[] = Array.from(dateMap.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, { progress }]) => {
      cumulativeProgress += progress;
      return {
        date,
        planned: Math.min(100, parseFloat(cumulativeProgress.toFixed(2))), // Cap at 100%
        actual: 0 // Will be filled in later with actual data
      };
    });
  
  return result;
}

/**
 * Calculate actual progress for S-Curve based on progress logs
 */
export function calculateActualCurve(progressLogs: ProgressLog[], wbsItems: WBSItem[]): SChartDataPoint[] {
  // Group progress logs by date
  const dateMap = new Map<string, number>();
  
  for (const log of progressLogs) {
    const dateStr = formatDate(new Date(log.created_at));
    
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, 0);
    }
    
    // Add the progress value to the date
    const currentProgress = dateMap.get(dateStr)!;
    dateMap.set(dateStr, currentProgress + log.progress);
  }
  
  // Calculate cumulative progress
  let cumulativeProgress = 0;
  const result: SChartDataPoint[] = Array.from(dateMap.entries())
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([date, dailyProgress]) => {
      cumulativeProgress += dailyProgress;
      return {
        date,
        planned: 0, // Will be filled in when combining with planned data
        actual: Math.min(100, parseFloat(cumulativeProgress.toFixed(2))) // Cap at 100%
      };
    });
  
  return result;
}

/**
 * Combine planned and actual curves
 */
export function combineCurves(plannedData: SChartDataPoint[], actualData: SChartDataPoint[]): SChartDataPoint[] {
  // Create a map of all unique dates
  const allDates = new Set([...plannedData.map(d => d.date), ...actualData.map(d => d.date)]);
  
  // Create result array with combined data
  const result: SChartDataPoint[] = [];
  
  for (const date of Array.from(allDates).sort()) {
    const plannedPoint = plannedData.find(p => p.date === date);
    const actualPoint = actualData.find(a => a.date === date);
    
    result.push({
      date,
      planned: plannedPoint?.planned || 0,
      actual: actualPoint?.actual || 0
    });
  }
  
  // Sort by date
  return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Calculate variance between actual and planned progress
 */
export function calculateVariancePercentage(planned: number, actual: number): number {
  if (planned === 0) return actual > 0 ? 100 : 0;
  return ((actual - planned) / planned) * 100;
}