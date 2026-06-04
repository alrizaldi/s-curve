"use server";

import { createClient } from "@/lib/supabase/server";
import { WBSItem, WBSItemFormValues, WBSItemStatus, ProgressLog } from "@/types";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

/**
 * Fetch all WBS items for a specific project
 */
export async function getWBSItems(projectId: string): Promise<WBSItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("WBSItem")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getWBSItems] Error fetching WBS items:", error);
    throw new Error("Failed to fetch WBS items");
  }

  // Convert date strings from Supabase to Date objects, handling potential null values
  const convertedData = (data || []).map((item) => {
    return {
      ...item,
      planned_start: item.planned_start
        ? new Date(item.planned_start)
        : new Date(),
      planned_end: item.planned_end ? new Date(item.planned_end) : new Date(),
      created_at: item.created_at ? new Date(item.created_at) : new Date(),
      updated_at: item.updated_at ? new Date(item.updated_at) : new Date(),
    } as WBSItem;
  });

  return convertedData;
}

/**
 * Create a new WBS item
 */
export async function createWBSItem(
  projectId: string,
  itemData: WBSItemFormValues,
): Promise<WBSItem> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Authentication error:", userError);
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("WBSItem")
    .insert([
      {
        id: uuidv4(), // Generate a UUID for the new WBS item
        ...itemData,
        project_id: projectId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating WBS item:", error);
    throw new Error("Failed to create WBS item");
  }

  // Recalculate rollup progress for the project
  await recalculateWBSProgress(projectId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/wbs`);
  revalidatePath("/wbs");

  return data as WBSItem;
}

/**
 * Update a WBS item (for attributes, or progress of a leaf node)
 */
export async function updateWBSItem(
  projectId: string,
  id: string,
  itemData: Partial<WBSItem>,
  remarks?: string,
): Promise<WBSItem> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Authentication error:", userError);
    throw new Error("User not authenticated");
  }

  // If we are updating progress, create a progress log (only if this is a leaf node)
  if (itemData.progress !== undefined) {
    // Check if the item has children. Only leaf nodes can be manually updated.
    const { data: children, error: childError } = await supabase
      .from("WBSItem")
      .select("id")
      .eq("parent_id", id);

    if (childError) {
      console.error("Error checking WBS item children:", childError);
    }

    if (children && children.length > 0) {
      throw new Error("Only leaf nodes can have progress updated directly.");
    }

    // Insert progress log
    const { error: logError } = await supabase.from("ProgressLog").insert([
      {
        project_id: projectId,
        wbs_item_id: id,
        progress: itemData.progress,
        remarks: remarks || "Progress updated",
        created_by: user.id,
      },
    ]);

    if (logError) {
      console.error("Error writing progress log:", logError);
    }
  }

  const { data, error } = await supabase
    .from("WBSItem")
    .update({ ...itemData, updated_at: new Date() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating WBS item:", error);
    throw new Error("Failed to update WBS item");
  }

  // Recalculate rollup progress for the project
  await recalculateWBSProgress(projectId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/wbs`);
  revalidatePath("/wbs");

  return data as WBSItem;
}

/**
 * Delete a WBS item
 */
export async function deleteWBSItem(
  projectId: string,
  id: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Authentication error:", userError);
    throw new Error("User not authenticated");
  }

  // Verify that the WBS item belongs to the project and user has permission
  const { data: wbsItem, error: fetchError } = await supabase
    .from("WBSItem")
    .select("project_id")
    .eq("id", id)
    .single();

  if (fetchError || !wbsItem) {
    console.error("Error fetching WBS item for verification:", fetchError);
    throw new Error("WBS item not found or access denied");
  }

  if (wbsItem.project_id !== projectId) {
    throw new Error(
      "Access denied: WBS item does not belong to the specified project",
    );
  }

  // Recursively delete children WBS items (since Supabase onDelete Cascade will handle it, or we handle it here if Cascade is not set in DB)
  // Our Prisma schema specifies `onDelete: Cascade` on the project relation, but for parent/children relationships
  // let's make sure children are deleted.
  // First, fetch all items to find children
  const { data: allItems, error: fetchError2 } = await supabase
    .from("WBSItem")
    .select("id, parent_id")
    .eq("project_id", projectId);

  if (fetchError2) {
    console.error("Error fetching items for deletion:", fetchError2);
  }

  const findChildrenIds = (parentId: string): string[] => {
    const ids: string[] = [];
    const children = (allItems || []).filter(
      (item) => item.parent_id === parentId,
    );
    for (const child of children) {
      ids.push(child.id);
      ids.push(...findChildrenIds(child.id));
    }
    return ids;
  };

  const idsToDelete = [id, ...findChildrenIds(id)];

  const { error } = await supabase
    .from("WBSItem")
    .delete()
    .in("id", idsToDelete);

  if (error) {
    console.error("Error deleting WBS items:", error);
    throw new Error("Failed to delete WBS items");
  }

  // Recalculate rollup progress for the project
  await recalculateWBSProgress(projectId);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/wbs`);
  revalidatePath("/wbs");
}

/**
 * Fetch progress logs for a specific project
 */
export async function getProgressLogs(projectId?: string) {
  const supabase = await createClient();

  let query = supabase.from("ProgressLog").select("*");
  
  if (projectId) {
    query = query.eq("project_id", projectId);
  }
  
  const { data, error } = await query.order("created_at", { ascending: false }); // Order by newest first

  if (error) {
    console.error("Error fetching progress logs:", error);
    throw new Error("Failed to fetch progress logs");
  }

  // Convert date strings to Date objects
  return (data || []).map((log) => ({
    ...log,
    created_at: log.created_at ? new Date(log.created_at) : new Date(),
  }));
}

/**
 * Recalculate parent progress recursively based on leaf nodes
 */
export async function recalculateWBSProgress(projectId: string): Promise<void> {
  const supabase = await createClient();

  // 1. Fetch all WBS items for this project
  const { data: items, error } = await supabase
    .from("WBSItem")
    .select("*")
    .eq("project_id", projectId);

  if (error || !items) {
    console.error("Error fetching WBS items for recalculation:", error);
    return;
  }

  // Map items for easy lookup
  const itemsMap = new Map<string, any>();
  items.forEach((item) => itemsMap.set(item.id, { ...item, computed: false }));

  // Build parent-child relationships
  const childrenMap = new Map<string, any[]>();
  items.forEach((item) => {
    if (item.parent_id) {
      if (!childrenMap.has(item.parent_id)) {
        childrenMap.set(item.parent_id, []);
      }
      childrenMap.get(item.parent_id)!.push(item);
    }
  });

  const updates: Array<{
    id: string;
    progress: number;
    status: WBSItemStatus;
  }> = [];

  // Recursive post-order traversal to compute parent progresses
  const calculateNode = (
    nodeId: string,
  ): { progress: number; status: WBSItemStatus } => {
    const node = itemsMap.get(nodeId);
    const children = childrenMap.get(nodeId);

    // If leaf node, return its current progress and status
    if (!children || children.length === 0) {
      return { progress: node.progress, status: node.status as WBSItemStatus };
    }

    // Recursively calculate children
    let totalWeight = 0;
    let weightedProgressSum = 0;
    const childStatuses: WBSItemStatus[] = [];

    for (const child of children) {
      const childResult = calculateNode(child.id);
      totalWeight += child.weight;
      weightedProgressSum += childResult.progress * child.weight;
      childStatuses.push(childResult.status);
    }

    const computedProgress =
      totalWeight > 0
        ? parseFloat((weightedProgressSum / totalWeight).toFixed(2))
        : 0;

    // Determine parent status based on children statuses
    let computedStatus: WBSItemStatus = "Not Started";
    if (childStatuses.every((s) => s === "Completed")) {
      computedStatus = "Completed";
    } else if (childStatuses.some((s) => s === "Delayed")) {
      computedStatus = "Delayed";
    } else if (
      childStatuses.some(
        (s) => s === "In Progress" || s === "Completed" || s === "Delayed",
      )
    ) {
      computedStatus = "In Progress";
    }

    // If the computed values differ from database values, queue an update
    if (node.progress !== computedProgress || node.status !== computedStatus) {
      updates.push({
        id: nodeId,
        progress: computedProgress,
        status: computedStatus,
      });
      node.progress = computedProgress;
      node.status = computedStatus;
    }

    node.computed = true;
    return { progress: computedProgress, status: computedStatus };
  };

  // Run calculation for all root nodes (parent_id is null or not in the project items)
  items.forEach((item) => {
    if (!item.parent_id) {
      calculateNode(item.id);
    }
  });

  // Perform updates in database
  for (const update of updates) {
    await supabase
      .from("WBSItem")
      .update({ progress: update.progress, status: update.status })
      .eq("id", update.id);
  }

  // Recalculate project overall progress
  // Project progress is the weighted average of its top-level (root) WBS items
  const rootItems = items.filter((item) => !item.parent_id);
  let totalRootWeight = 0;
  let rootWeightedProgressSum = 0;

  rootItems.forEach((item) => {
    totalRootWeight += item.weight;
    rootWeightedProgressSum += item.progress * item.weight;
  });

  const overallProjectProgress =
    totalRootWeight > 0
      ? parseFloat((rootWeightedProgressSum / totalRootWeight).toFixed(2))
      : 0;

  // Note: If a progress column is added to the Project table in the future, it can be updated here:
  // await supabase.from('Project').update({ progress: overallProjectProgress }).eq('id', projectId);
}