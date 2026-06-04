'use server';

import { createClient } from '@/lib/supabase/server';
import { Milestone, MilestoneFormValues } from '@/types';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetch all milestones for a specific project
 */
export async function getMilestones(projectId: string): Promise<Milestone[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('Milestone')
    .select('*')
    .eq('project_id', projectId)
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching milestones:', error);
    throw new Error('Failed to fetch milestones');
  }

  // Convert date strings from Supabase to Date objects
  return (data || []).map(m => ({
    ...m,
    due_date: new Date(m.due_date),
    completed_date: m.completed_date ? new Date(m.completed_date) : undefined,
    created_at: new Date(m.created_at),
    updated_at: new Date(m.updated_at),
  })) as Milestone[];
}

/**
 * Create a new milestone
 */
export async function createMilestone(
  projectId: string,
  milestoneData: MilestoneFormValues
): Promise<Milestone> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Authentication error:', userError);
    throw new Error('User not authenticated');
  }

  // Check if the user exists in the profiles table, create if not
  let profile;
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, auth_user_id, full_name, email')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError) {
    // Profile doesn't exist, create one
    const newProfile = {
      id: uuidv4(),
      auth_user_id: user.id,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Unknown User',
      email: user.email || '',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const { data: createdProfile, error: createProfileError } = await supabase
      .from('profiles')
      .insert([newProfile])
      .select()
      .single();

    if (createProfileError) {
      console.error('Error creating profile:', createProfileError);
      throw new Error('Failed to create user profile');
    }

    profile = createdProfile;
  } else {
    profile = existingProfile;
  }

  const { data, error } = await supabase
    .from('Milestone')
    .insert([
      {
        id: uuidv4(), // Generate a UUID for the new milestone
        ...milestoneData,
        project_id: projectId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating milestone:', error);
    throw new Error('Failed to create milestone');
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/milestones`);
  revalidatePath('/milestones');

  return data as Milestone;
}

/**
 * Update an existing milestone
 */
export async function updateMilestone(
  projectId: string,
  id: string,
  milestoneData: Partial<Milestone>
): Promise<Milestone> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Authentication error:', userError);
    throw new Error('User not authenticated');
  }

  // Verify that the milestone belongs to the project and user has permission
  const { data: milestone, error: fetchError } = await supabase
    .from('Milestone')
    .select('project_id')
    .eq('id', id)
    .single();

  if (fetchError || !milestone) {
    console.error('Error fetching milestone for verification:', fetchError);
    throw new Error('Milestone not found or access denied');
  }

  if (milestone.project_id !== projectId) {
    throw new Error('Access denied: Milestone does not belong to the specified project');
  }

  const { data, error } = await supabase
    .from('Milestone')
    .update({...milestoneData, updated_at: new Date()})
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating milestone:', error);
    throw new Error('Failed to update milestone');
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/milestones`);
  revalidatePath('/milestones');

  return data as Milestone;
}

/**
 * Delete a milestone
 */
export async function deleteMilestone(projectId: string, id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Authentication error:', userError);
    throw new Error('User not authenticated');
  }

  // Verify that the milestone belongs to the project and user has permission
  const { data: milestone, error: fetchError } = await supabase
    .from('Milestone')
    .select('project_id')
    .eq('id', id)
    .single();

  if (fetchError || !milestone) {
    console.error('Error fetching milestone for verification:', fetchError);
    throw new Error('Milestone not found or access denied');
  }

  if (milestone.project_id !== projectId) {
    throw new Error('Access denied: Milestone does not belong to the specified project');
  }

  const { error } = await supabase
    .from('Milestone')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting milestone:', error);
    throw new Error('Failed to delete milestone');
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/milestones`);
  revalidatePath('/milestones');
}