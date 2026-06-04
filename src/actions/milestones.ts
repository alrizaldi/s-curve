'use server';

import { createClient } from '@/lib/supabase/server';
import { Milestone, MilestoneFormValues } from '@/types';
import { revalidatePath } from 'next/cache';

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

  const { data, error } = await supabase
    .from('Milestone')
    .insert([
      {
        ...milestoneData,
        project_id: projectId,
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

  const { data, error } = await supabase
    .from('Milestone')
    .update(milestoneData)
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
