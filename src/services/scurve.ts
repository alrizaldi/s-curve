import { WBSItem, ProgressLog, SChartDataPoint } from "@/types";

/**
 * Formats a date to YYYY-MM-DD format
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
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
    const duration = Math.max(
      1,
      Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

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
        progress: current.progress + dailyProgress,
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
        actual: 0, // Will be filled in later with actual data
      };
    });

  return result;
}

/**
 * Calculate actual progress for S-Curve based on progress logs
 */
export function calculateActualCurve(
  progressLogs: ProgressLog[],
  wbsItems: WBSItem[],
): SChartDataPoint[] {
  if (!progressLogs || progressLogs.length === 0) {
    return [];
  }
  
  // Group progress logs by date
  const dateMap = new Map<string, { wbsItems: Map<string, number> }>();
  
  for (const log of progressLogs) {
    const dateStr = formatDate(new Date(log.created_at));
    
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { wbsItems: new Map<string, number>() });
    }
    
    const dateData = dateMap.get(dateStr)!;
    const currentProgress = dateData.wbsItems.get(log.wbs_item_id) || 0;
    
    // Only store the highest progress value for each WBS item on each date
    if (log.progress > currentProgress) {
      dateData.wbsItems.set(log.wbs_item_id, log.progress);
    }
  }
  
  // Get all unique dates and sort them chronologically
  const sortedDates = Array.from(dateMap.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  // Calculate cumulative progress over time
  const wbsProgressTracker = new Map<string, number>(); // Track the highest progress achieved for each WBS item
  const result: SChartDataPoint[] = [];
  
  // Calculate total possible weight
  const totalWeight = wbsItems.reduce((sum, item) => sum + item.weight, 0);
  
  for (const date of sortedDates) {
    const dateData = dateMap.get(date)!;
    
    // Update the tracker with new progress values for this date
    for (const [wbsId, progress] of dateData.wbsItems) {
      if (!wbsProgressTracker.has(wbsId) || progress > wbsProgressTracker.get(wbsId)!) {
        wbsProgressTracker.set(wbsId, progress);
      }
    }
    
    // Calculate total weighted progress based on the highest progress achieved for each WBS item
    let totalAchievedWeight = 0;
    
    for (const [wbsId, progress] of wbsProgressTracker) {
      const wbsItem = wbsItems.find(item => item.id === wbsId);
      if (wbsItem) {
        // Add the portion of the weight that corresponds to the achieved progress
        // For example, if an item has 20% weight and is 50% complete, add 10% to total
        totalAchievedWeight += (wbsItem.weight * progress) / 100;
      }
    }
    
    // Calculate percentage of total weight achieved
    const achievedPercentage = totalWeight > 0 ? (totalAchievedWeight / totalWeight) * 100 : 0;
    
    result.push({
      date,
      planned: 0, // Will be filled in when combining with planned data
      actual: parseFloat(achievedPercentage.toFixed(2))
    });
  }
  
  // Fill in missing dates and carry forward the last known actual progress
  if (result.length === 0) return [];

  const fullResult: SChartDataPoint[] = [];
  let currentDate = new Date(result[0].date);
  let lastActual = result[0].actual;
  const endDate = new Date(result[result.length - 1].date);

  // Iterate through all dates from first to last
  while (currentDate <= endDate) {
    const currentDateString = formatDate(currentDate);
    const entry = result.find((point) => point.date === currentDateString);
    
    if (entry) {
      // If there is an actual progress entry for this date, use it
      lastActual = entry.actual;
      fullResult.push({
        date: currentDateString,
        planned: 0,
        actual: lastActual
      });
    } else {
      // Otherwise, carry forward the last known actual progress
      fullResult.push({
        date: currentDateString,
        planned: 0,
        actual: lastActual
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return fullResult;
}

/**
 * Combine planned and actual curves
 */
export function combineCurves(
  plannedData: SChartDataPoint[],
  actualData: SChartDataPoint[],
): SChartDataPoint[] {
  // If no actual data exists, return planned data with 0 actual values
  if (actualData.length === 0) {
    return plannedData.map(point => ({
      date: point.date,
      planned: point.planned,
      actual: 0
    }));
  }

  // Create a map of all unique dates
  const allDates = new Set([
    ...plannedData.map((d) => d.date),
    ...actualData.map((d) => d.date),
  ]);

  // Sort all dates chronologically
  const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Create maps for planned and actual data
  const plannedMap = new Map(plannedData.map(item => [item.date, item.planned]));
  const actualMap = new Map(actualData.map(item => [item.date, item.actual]));

  // Process dates in chronological order to maintain actual progress
  let lastActualValue = 0;
  const result: SChartDataPoint[] = [];

  for (const date of sortedDates) {
    const planned = plannedMap.get(date) || 0;
    const actual = actualMap.get(date) || null; // Don't default to 0, we'll handle this below

    if (actual !== null) {
      // If we have an actual value for this date, use it and update our tracker
      lastActualValue = actual;
    }
    // If no actual value for this date, we maintain the last known actual value
    
    result.push({
      date,
      planned,
      actual: lastActualValue // Use the maintained value
    });
  }

  return result;
}

/**
 * Calculate variance between actual and planned progress
 */
export function calculateVariancePercentage(
  planned: number,
  actual: number,
): number {
  if (planned === 0) return actual > 0 ? 100 : 0;
  return ((actual - planned) / planned) * 100;
}
