"use server";

import { createClient } from "@/lib/supabase/server";
import { Project, ProjectFormValues } from "@/types";
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
