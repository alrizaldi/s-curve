import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Project, WBSItem, ProgressLog } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return Response.json({ error: "User not authenticated" }, { status: 401 });
  }

  try {
    // Create a sample project
    const sampleProject = {
      id: uuidv4(),
      name: "Sample Construction Project",
      description:
        "A sample construction project to demonstrate S-Curve functionality",
      start_date: new Date("2026-06-01"),
      end_date: new Date("2026-12-31"),
      status: "Active" as const,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: projectData, error: projectError } = await supabase
      .from("Project")
      .insert([sampleProject])
      .select()
      .single();

    if (projectError) {
      throw new Error(`Failed to create project: ${projectError.message}`);
    }

    // Create sample WBS items
    const wbsItems = [
      {
        id: uuidv4(),
        project_id: sampleProject.id,
        name: "Foundation Work",
        description: "Excavation, footings, and foundation walls",
        weight: 20,
        progress: 100, // Already completed
        planned_start: new Date("2026-06-01"),
        planned_end: new Date("2026-07-15"),
        status: "Completed" as const,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        project_id: sampleProject.id,
        name: "Structural Framework",
        description: "Steel framing and structural elements",
        weight: 25,
        progress: 100, // Already completed
        planned_start: new Date("2026-07-01"),
        planned_end: new Date("2026-08-15"),
        status: "Completed" as const,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        project_id: sampleProject.id,
        name: "Electrical Installation",
        description: "Rough-in electrical work",
        weight: 15,
        progress: 50, // Halfway completed
        planned_start: new Date("2026-08-01"),
        planned_end: new Date("2026-09-30"),
        status: "In Progress" as const,
        sort_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        project_id: sampleProject.id,
        name: "Plumbing Installation",
        description: "Rough-in plumbing work",
        weight: 15,
        progress: 50, // Halfway completed
        planned_start: new Date("2026-08-15"),
        planned_end: new Date("2026-10-15"),
        status: "In Progress" as const,
        sort_order: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        project_id: sampleProject.id,
        name: "Interior Finishing",
        description: "Drywall, painting, flooring",
        weight: 20,
        progress: 0, // Not started yet
        planned_start: new Date("2026-10-01"),
        planned_end: new Date("2026-11-30"),
        status: "Not Started" as const,
        sort_order: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        project_id: sampleProject.id,
        name: "Final Inspection",
        description: "Quality assurance and final inspection",
        weight: 5,
        progress: 0, // Not started yet
        planned_start: new Date("2026-12-01"),
        planned_end: new Date("2026-12-15"),
        status: "Not Started" as const,
        sort_order: 6,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const { error: wbsError } = await supabase.from("WBSItem").insert(wbsItems);

    if (wbsError) {
      throw new Error(`Failed to create WBS items: ${wbsError.message}`);
    }

    // Create progress logs for the completed and partially completed items
    const progressLogs = [
      {
        id: uuidv4(),
        project_id: sampleProject.id,
        wbs_item_id: wbsItems[0].id, // Foundation Work
        progress: 100,
        remarks: "Foundation work completed successfully",
        created_by: user.id,
        created_at: new Date("2026-07-10"),
      },
      {
        id: uuidv4(),
        project_id: sampleProject.id,
        wbs_item_id: wbsItems[1].id, // Structural Framework
        progress: 100,
        remarks: "Structural framework completed",
        created_by: user.id,
        created_at: new Date("2026-08-10"),
      },
      {
        id: uuidv4(),
        project_id: sampleProject.id,
        wbs_item_id: wbsItems[2].id, // Electrical Installation
        progress: 50,
        remarks: "Half of electrical installation completed",
        created_by: user.id,
        created_at: new Date("2026-09-01"),
      },
      {
        id: uuidv4(),
        project_id: sampleProject.id,
        wbs_item_id: wbsItems[3].id, // Plumbing Installation
        progress: 50,
        remarks: "Half of plumbing rough-in completed",
        created_by: user.id,
        created_at: new Date("2026-09-05"),
      },
    ];

    const { error: logError } = await supabase
      .from("ProgressLog")
      .insert(progressLogs);

    if (logError) {
      throw new Error(`Failed to create progress logs: ${logError.message}`);
    }

    return Response.json({
      success: true,
      project: projectData,
      message: "Sample project created successfully with halfway progress",
    });
  } catch (error: any) {
    console.error("Error creating sample project:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
