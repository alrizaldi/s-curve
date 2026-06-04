// Constants for the S-Curve Project Monitoring System

export const PROJECT_STATUS = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;

export const WBS_ITEM_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  DELAYED: 'Delayed',
} as const;

export const MILESTONE_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  DELAYED: 'Delayed',
} as const;

export const ROLE_TYPES = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'Project Manager',
  VIEWER: 'Viewer',
} as const;

export const DEFAULT_WEIGHT = 1.0;
export const MAX_PROGRESS = 100;
export const MIN_PROGRESS = 0;

// Dashboard metrics keys
export const DASHBOARD_METRICS = {
  TOTAL_PROJECTS: 'totalProjects',
  ACTIVE_PROJECTS: 'activeProjects',
  COMPLETED_PROJECTS: 'completedProjects',
  DELAYED_PROJECTS: 'delayedProjects',
} as const;

// Status indicators
export const STATUS_INDICATORS = {
  ON_TRACK: 'on-track',
  SLIGHT_DELAY: 'slight-delay',
  CRITICAL_DELAY: 'critical-delay',
} as const;

// Color mappings
export const STATUS_COLORS = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
  GRAY: 'gray',
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'YYYY-MM-DD',
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication is required to access this resource.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  PROJECT_NOT_FOUND: 'Project not found.',
  WBS_ITEM_NOT_FOUND: 'WBS item not found.',
  MILESTONE_NOT_FOUND: 'Milestone not found.',
  INVALID_INPUT: 'Invalid input provided.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PROJECT_CREATED: 'Project created successfully.',
  PROJECT_UPDATED: 'Project updated successfully.',
  PROJECT_DELETED: 'Project deleted successfully.',
  WBS_ITEM_CREATED: 'WBS item created successfully.',
  WBS_ITEM_UPDATED: 'WBS item updated successfully.',
  MILESTONE_CREATED: 'Milestone created successfully.',
  MILESTONE_UPDATED: 'Milestone updated successfully.',
  PROGRESS_LOGGED: 'Progress logged successfully.',
  BASELINE_CREATED: 'Baseline created successfully.',
} as const;