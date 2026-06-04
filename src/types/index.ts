// Type definitions for the S-Curve Project Monitoring System

export type UserProfile = {
  id: string;
  auth_user_id: string;
  full_name?: string;
  email: string;
  created_at: Date;
  updated_at: Date;
};

export type ProjectStatus = 'Draft' | 'Active' | 'Completed' | 'Cancelled';

export type Project = {
  id: string;
  name: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  status: ProjectStatus;
  created_by: string;
  created_at: Date;
  updated_at: Date;
};

export type WBSItemStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';

export type WBSItem = {
  id: string;
  project_id: string;
  parent_id?: string;
  name: string;
  description?: string;
  weight: number;
  progress: number;
  planned_start: Date;
  planned_end: Date;
  status: WBSItemStatus;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

export type MilestoneStatus = 'Pending' | 'Completed' | 'Delayed';

export type Milestone = {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  due_date: Date;
  completed_date?: Date;
  status: MilestoneStatus;
  created_at: Date;
  updated_at: Date;
};

export type Baseline = {
  id: string;
  project_id: string;
  baseline_name: string;
  snapshot?: any; // JSON object containing the baseline data
  created_at: Date;
};

export type ProgressLog = {
  id: string;
  project_id: string;
  wbs_item_id: string;
  progress: number;
  remarks?: string;
  created_by: string;
  created_at: Date;
};

// Extended types for UI components
export type ProjectWithDetails = Project & {
  wbs_items: WBSItem[];
  milestones: Milestone[];
  baselines: Baseline[];
  progress_logs: ProgressLog[];
};

export type WBSItemWithChildren = WBSItem & {
  children: WBSItemWithChildren[];
};

// Form types
export type ProjectFormValues = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

export type WBSItemFormValues = Omit<WBSItem, 'id' | 'project_id' | 'created_at' | 'updated_at'> & {
  parent_id?: string;
};

export type MilestoneFormValues = Omit<Milestone, 'id' | 'project_id' | 'created_at' | 'updated_at'>;

// Chart data types
export type SChartDataPoint = {
  date: string;
  planned: number;
  actual: number;
};

export type DashboardMetrics = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
};