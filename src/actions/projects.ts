"use server";

import { createClient } from "@/lib/supabase/server";
import { Project, ProjectFormValues, WBSItem, Milestone, ProgressLog, Baseline } from "@/types";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

/**
 * Fetch all projects for the current user
 */
export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("Project")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    throw new Error("Failed to fetch projects");
  }

  return data as Project[];
}

/**
 * Create a new project
 */
export async function createProject(
  projectData: ProjectFormValues,
): Promise<Project> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Authentication error:", userError);
    throw new Error("User not authenticated");
  }

  // Check if the user exists in the profiles table, create if not
  let profile;
  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, auth_user_id, full_name, email")
    .eq("auth_user_id", user.id)
    .single();

  if (profileError) {
    // Profile doesn't exist, create one
    const newProfile = {
      id: uuidv4(),
      auth_user_id: user.id,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "Unknown User",
      email: user.email || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdProfile, error: createProfileError } = await supabase
      .from("profiles")
      .insert([newProfile])
      .select()
      .single();

    if (createProfileError) {
      console.error("Error creating profile:", createProfileError);
      throw new Error("Failed to create user profile");
    }

    profile = createdProfile;
  } else {
    profile = existingProfile;
  }

  const newProject = {
    id: uuidv4(), // Generate a UUID for the new project
    ...projectData,
    created_by: user.id, // Using the authenticated user's ID
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("Project")
    .insert([newProject])
    .select()
    .single();

  if (error) {
    console.error("Error creating project:", error);
    throw new Error("Failed to create project");
  }

  revalidatePath("/projects");
  return data as Project;
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  projectData: Partial<Project>,
): Promise<Project> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("Project")
    .update(projectData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating project:", error);
    throw new Error("Failed to update project");
  }

  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
  return data as Project;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("Project").delete().eq("id", id);

  if (error) {
    console.error("Error deleting project:", error);
    throw new Error("Failed to delete project");
  }

  revalidatePath("/projects");
}

/**
 * Fetch a single project by ID
 */
export async function getProjectById(id: string): Promise<Project> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("Project")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    throw new Error("Failed to fetch project");
  }

  return data as Project;
}

/**
 * Fetch a single project by ID with all related data
 */
export async function getProjectWithDetails(id: string) {
  const supabase = await createClient();

  // Get the project
  const { data: project, error: projectError } = await supabase
    .from("Project")
    .select("*")
    .eq("id", id)
    .single();

  if (projectError) {
    console.error("Error fetching project:", projectError);
    throw new Error("Failed to fetch project");
  }

  // Get WBS items for the project
  const { data: wbsItems, error: wbsError } = await supabase
    .from("WBSItem")
    .select("*")
    .eq("project_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (wbsError) {
    console.error("Error fetching WBS items:", wbsError);
    throw new Error("Failed to fetch WBS items");
  }

  // Get milestones for the project
  const { data: milestones, error: milestoneError } = await supabase
    .from("Milestone")
    .select("*")
    .eq("project_id", id)
    .order("due_date", { ascending: true });

  if (milestoneError) {
    console.error("Error fetching milestones:", milestoneError);
    throw new Error("Failed to fetch milestones");
  }

  // Get progress logs for the project
  const { data: progressLogs, error: logError } = await supabase
    .from("ProgressLog")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (logError) {
    console.error("Error fetching progress logs:", logError);
    throw new Error("Failed to fetch progress logs");
  }

  // Get baselines for the project
  const { data: baselines, error: baselineError } = await supabase
    .from("Baseline")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (baselineError) {
    console.error("Error fetching baselines:", baselineError);
    // Don't throw error, as baselines might not exist yet
    console.warn("Could not fetch baselines for project:", baselineError);
  }

  // Convert date strings to Date objects for all entities
  const convertedWBSItems = (wbsItems || []).map((item) => ({
    ...item,
    planned_start: item.planned_start
      ? new Date(item.planned_start)
      : new Date().toISOString(),
    planned_end: item.planned_end
      ? new Date(item.planned_end)
      : new Date().toISOString(),
    created_at: item.created_at
      ? new Date(item.created_at)
      : new Date().toISOString(),
    updated_at: item.updated_at
      ? new Date(item.updated_at)
      : new Date().toISOString(),
  }));

  const convertedMilestones = (milestones || []).map((milestone) => ({
    ...milestone,
    due_date: new Date(milestone.due_date),
    completed_date: milestone.completed_date ? new Date(milestone.completed_date) : undefined,
    created_at: new Date(milestone.created_at),
    updated_at: new Date(milestone.updated_at),
  }));

  const convertedProgressLogs = (progressLogs || []).map((log) => ({
    ...log,
    created_at: log.created_at
      ? new Date(log.created_at)
      : new Date().toISOString(),
  }));

  const convertedBaselines = (baselines || []).map((baseline) => ({
    ...baseline,
    created_at: new Date(baseline.created_at),
  }));

  return {
    project: project as Project,
    wbsItems: convertedWBSItems as WBSItem[],
    milestones: convertedMilestones as Milestone[],
    progressLogs: convertedProgressLogs as ProgressLog[],
    baselines: convertedBaselines as Baseline[],
  };
}

// Remove the duplicate export statement since functions are already exported individually
