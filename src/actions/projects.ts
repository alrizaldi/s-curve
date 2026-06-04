'use server';

import { createClient } from '@/lib/supabase/server';
import { Project, ProjectFormValues } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Fetch all projects for the current user
 */
export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('Project')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects');
  }

  return data as Project[];
}

/**
 * Create a new project
 */
export async function createProject(projectData: ProjectFormValues): Promise<Project> {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getSession();
  
  if (!session.session) {
    throw new Error('User not authenticated');
  }

  const newProject = {
    ...projectData,
    created_by: session.session.user.id,
  };

  const { data, error } = await supabase
    .from('Project')
    .insert([newProject])
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }

  revalidatePath('/projects');
  return data as Project;
}

/**
 * Update an existing project
 */
export async function updateProject(id: string, projectData: Partial<Project>): Promise<Project> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('Project')
    .update(projectData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }

  revalidatePath(`/projects/${id}`);
  revalidatePath('/projects');
  return data as Project;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('Project')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }

  revalidatePath('/projects');
}