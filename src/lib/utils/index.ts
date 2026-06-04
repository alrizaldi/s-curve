import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility functions for the S-Curve project

/**
 * Calculates the progress percentage based on completed vs total items
 */
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Formats a date to YYYY-MM-DD format
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a date string to a formatted date string
 */
export function formatDateFromISOString(dateString: string): string {
  const date = new Date(dateString);
  return formatDate(date);
}

/**
 * Calculates the difference in days between two dates
 */
export function daysDifference(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates variance between actual and planned progress
 */
export function calculateVariance(actual: number, planned: number): number {
  return actual - planned;
}

/**
 * Gets status indicator based on variance
 */
export function getStatusIndicator(variance: number): 'on-track' | 'slight-delay' | 'critical-delay' {
  if (variance >= 0) return 'on-track'; // On track or ahead
  if (variance > -10) return 'slight-delay'; // Less than 10% behind
  return 'critical-delay'; // More than 10% behind
}

/**
 * Generates a color based on status indicator
 */
export function getStatusColor(status: 'on-track' | 'slight-delay' | 'critical-delay'): string {
  switch (status) {
    case 'on-track':
      return 'green';
    case 'slight-delay':
      return 'yellow';
    case 'critical-delay':
      return 'red';
    default:
      return 'gray';
  }
}